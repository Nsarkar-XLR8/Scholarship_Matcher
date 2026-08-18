import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class OpenSearchService implements OnModuleInit {
  private readonly logger = new Logger(OpenSearchService.name);
  private client: Client | null = null;
  private readonly indexName = 'programs_scholarships_index';

  async onModuleInit() {
    try {
      const node = process.env.OPENSEARCH_NODE || 'http://localhost:9200';
      this.client = new Client({ node });

      // Check cluster health
      await this.client.ping();
      this.logger.log('✅ OpenSearch client connected successfully.');
      await this.ensureIndex();
    } catch (error) {
      this.logger.warn('⚠️ OpenSearch cluster not reachable. Search will fall back to PostgreSQL:', error.message);
      this.client = null;
    }
  }

  private async ensureIndex() {
    if (!this.client) return;
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      if (!exists.body) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                programId: { type: 'keyword' },
                title: { type: 'text' },
                fieldOfStudy: { type: 'keyword' },
                degreeLevel: { type: 'keyword' },
                universityId: { type: 'keyword' },
                universityName: { type: 'text' },
                countryIsoCode: { type: 'keyword' },
                countryName: { type: 'keyword' },
                minGpa: { type: 'float' },
                minIelts: { type: 'float' },
                minGre: { type: 'integer' },
                tuitionFeeUsd: { type: 'float' },
                maxScholarshipPct: { type: 'float' },
                hasVerifiedScholarship: { type: 'boolean' },
              },
            },
          },
        });
        this.logger.log(`Created OpenSearch index '${this.indexName}'`);
      }
    } catch (error) {
      this.logger.error('Failed to create OpenSearch index:', error.message);
    }
  }

  async indexProgramDocument(doc: Record<string, any>): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.index({
        index: this.indexName,
        id: doc.programId,
        body: doc,
        refresh: true,
      });
    } catch (error) {
      this.logger.error(`OpenSearch indexing error for program ${doc.programId}:`, error.message);
    }
  }

  async bulkIndexProgramDocuments(docs: Record<string, any>[]): Promise<void> {
    if (!this.client || !docs || docs.length === 0) return;
    try {
      const body = docs.flatMap((doc) => [{ index: { _index: this.indexName, _id: doc.programId } }, doc]);
      await this.client.bulk({ refresh: true, body });
      this.logger.log(`Bulk indexed ${docs.length} program documents into OpenSearch.`);
    } catch (error) {
      this.logger.error('OpenSearch bulk indexing error:', error.message);
    }
  }

  async searchPrograms(queryText?: string, filters?: any): Promise<any[] | null> {
    if (!this.client) return null; // Fallback signal
    try {
      const mustClauses: any[] = [];

      if (queryText) {
        mustClauses.push({
          multi_match: {
            query: queryText,
            fields: ['title^3', 'fieldOfStudy^2', 'universityName'],
          },
        });
      }

      if (filters?.countryIsoCode) {
        mustClauses.push({ term: { countryIsoCode: filters.countryIsoCode } });
      }

      if (filters?.fieldOfStudy && filters.fieldOfStudy.trim().length > 0) {
        mustClauses.push({
          match: {
            fieldOfStudy: {
              query: filters.fieldOfStudy,
              operator: 'or',
            },
          },
        });
      }

      if (filters?.maxGpaRequirement) {
        mustClauses.push({ range: { minGpa: { lte: filters.maxGpaRequirement } } });
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: mustClauses.length > 0 ? { bool: { must: mustClauses } } : { match_all: {} },
          size: 50,
        },
      });

      return response.body.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error('OpenSearch search query failed:', error.message);
      return null; // Trigger database fallback
    }
  }
}
