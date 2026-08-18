import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { OpenSearchService } from '../../common/services/opensearch.service';

@Module({
  controllers: [SearchController],
  providers: [SearchService, OpenSearchService],
  exports: [SearchService, OpenSearchService],
})
export class SearchModule {}
