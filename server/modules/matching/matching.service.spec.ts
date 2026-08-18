import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let prismaMock: any;
  let redisMock: any;

  beforeEach(async () => {
    prismaMock = {
      program: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'prog-1',
            title: 'M.Sc. Computer Science',
            fieldOfStudy: 'Computer Science',
            universityId: 'uni-1',
            university: {
              id: 'uni-1',
              name: 'Technical University of Munich',
              domain: 'tum.de',
              rankingQs: 37,
              primaryCountry: { id: 'c-de', isoCode: 'DE', name: 'Germany' },
            },
            campus: {
              id: 'camp-1',
              name: 'Main Campus',
              countryId: 'c-de',
              country: { id: 'c-de', isoCode: 'DE', name: 'Germany' },
            },
            requirements: [
              {
                minGpa: 3.2,
                minIelts: 6.5,
                minGre: 315,
                requiresPapers: false,
                validTo: null,
              },
            ],
            scholarshipRules: [
              {
                id: 'rule-1',
                title: 'TUM Merit Waiver',
                scope: 'PROGRAM',
                type: 'TIERED_FORMULA',
                fundingPctMin: 50.0,
                tierCriteriaJson: [
                  { minGpa: 3.5, fundingPct: 50.0 },
                  { minGpa: 3.8, fundingPct: 100.0 },
                ],
                confidence: 'VERIFIED',
                sourceUrl: 'https://tum.de',
                description: 'Formula waiver',
              },
            ],
            outcomeReports: [
              { scholarshipPctReceived: 50.0 },
              { scholarshipPctReceived: 100.0 },
            ],
          },
        ]),
      },
      scholarshipRule: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  it('should evaluate student profile and return qualified program matches', async () => {
    const result = await service.evaluateStudentProfile({
      gpa: 3.6,
      gpaScale: 4.0,
      ielts: 7.0,
      gre: 320,
      targetField: 'Computer Science',
    });

    expect(result.normalizedGpa4Scale).toBe(3.6);
    expect(result.matches.length).toBe(1);

    const match = result.matches[0];
    expect(match.programTitle).toBe('M.Sc. Computer Science');
    expect(match.qualificationStatus).toBe('QUALIFIED');
    expect(match.scholarshipOffer.publishedRules.length).toBe(1);
    expect(match.scholarshipOffer.publishedRules[0].calculatedPct).toBe(50.0);
    expect(match.scholarshipOffer.crowdsourcedDistribution).toBeDefined();
  });
});
