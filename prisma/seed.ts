import { PrismaClient, DegreeLevel, ConfidenceLevel, ScholarshipScope, ScholarshipType, CoverageType, OutcomeVerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Global Masters Scholarship Matcher...');

  // 1. Seed Continents (UN M49)
  const europe = await prisma.continent.upsert({
    where: { code: 'EU' },
    update: {},
    create: { code: 'EU', name: 'Europe', unM49Code: '150' },
  });

  const northAmerica = await prisma.continent.upsert({
    where: { code: 'NA' },
    update: {},
    create: { code: 'NA', name: 'North America', unM49Code: '021' },
  });

  const asia = await prisma.continent.upsert({
    where: { code: 'AS' },
    update: {},
    create: { code: 'AS', name: 'Asia', unM49Code: '142' },
  });

  // 2. Seed Regions
  const westernEurope = await prisma.region.upsert({
    where: { code: 'WEU' },
    update: {},
    create: { code: 'WEU', name: 'Western Europe', continentId: europe.id },
  });

  const northernEurope = await prisma.region.upsert({
    where: { code: 'NEU' },
    update: {},
    create: { code: 'NEU', name: 'Northern Europe', continentId: europe.id },
  });

  const northernAmerica = await prisma.region.upsert({
    where: { code: 'NAM' },
    update: {},
    create: { code: 'NAM', name: 'Northern America', continentId: northAmerica.id },
  });

  const southEasternAsia = await prisma.region.upsert({
    where: { code: 'SEA' },
    update: {},
    create: { code: 'SEA', name: 'South-Eastern Asia', continentId: asia.id },
  });

  // 3. Seed Countries (ISO 3166-1)
  const germany = await prisma.country.upsert({
    where: { isoCode: 'DE' },
    update: {},
    create: {
      isoCode: 'DE',
      iso3Code: 'DEU',
      name: 'Germany',
      regionId: westernEurope.id,
      currencyCode: 'EUR',
      avgTuitionMinUsd: 0.0,
      avgTuitionMaxUsd: 3000.0,
      estMonthlyLivingCostUsd: 1100.0,
      dataCompletenessPct: 85.0,
    },
  });

  const netherlands = await prisma.country.upsert({
    where: { isoCode: 'NL' },
    update: {},
    create: {
      isoCode: 'NL',
      iso3Code: 'NLD',
      name: 'Netherlands',
      regionId: westernEurope.id,
      currencyCode: 'EUR',
      avgTuitionMinUsd: 12000.0,
      avgTuitionMaxUsd: 22000.0,
      estMonthlyLivingCostUsd: 1300.0,
      dataCompletenessPct: 80.0,
    },
  });

  const uk = await prisma.country.upsert({
    where: { isoCode: 'GB' },
    update: {},
    create: {
      isoCode: 'GB',
      iso3Code: 'GBR',
      name: 'United Kingdom',
      regionId: northernEurope.id,
      currencyCode: 'GBP',
      avgTuitionMinUsd: 20000.0,
      avgTuitionMaxUsd: 45000.0,
      estMonthlyLivingCostUsd: 1600.0,
      dataCompletenessPct: 90.0,
    },
  });

  const us = await prisma.country.upsert({
    where: { isoCode: 'US' },
    update: {},
    create: {
      isoCode: 'US',
      iso3Code: 'USA',
      name: 'United States',
      regionId: northernAmerica.id,
      currencyCode: 'USD',
      avgTuitionMinUsd: 30000.0,
      avgTuitionMaxUsd: 65000.0,
      estMonthlyLivingCostUsd: 2000.0,
      dataCompletenessPct: 92.0,
    },
  });

  const malaysia = await prisma.country.upsert({
    where: { isoCode: 'MY' },
    update: {},
    create: {
      isoCode: 'MY',
      iso3Code: 'MYS',
      name: 'Malaysia',
      regionId: southEasternAsia.id,
      currencyCode: 'MYR',
      avgTuitionMinUsd: 5000.0,
      avgTuitionMaxUsd: 14000.0,
      estMonthlyLivingCostUsd: 600.0,
      dataCompletenessPct: 75.0,
    },
  });

  // 4. Seed Country-level Scholarships (e.g., DAAD, Chevening)
  await prisma.scholarshipRule.create({
    data: {
      title: 'DAAD Development-Related Postgraduate Courses (EPOS)',
      scope: ScholarshipScope.COUNTRY,
      type: ScholarshipType.TUITION_WAIVER,
      coverageType: CoverageType.FULL_TUITION,
      countryId: germany.id,
      fundingPctMin: 100.0,
      fundingPctMax: 100.0,
      description: 'Full monthly stipend (934 EUR/month) + tuition waiver + travel allowance for applicants with 2+ years professional experience.',
      sourceUrl: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
      confidence: ConfidenceLevel.VERIFIED,
    },
  });

  await prisma.scholarshipRule.create({
    data: {
      title: 'Chevening UK Government Masters Scholarship',
      scope: ScholarshipScope.COUNTRY,
      type: ScholarshipType.HOLISTIC,
      coverageType: CoverageType.FULL_TUITION,
      countryId: uk.id,
      fundingPctMin: 100.0,
      fundingPctMax: 100.0,
      description: 'Fully funded 1-year master’s degree in the UK including tuition, living allowance, and return flights.',
      sourceUrl: 'https://www.chevening.org/scholarships/',
      confidence: ConfidenceLevel.VERIFIED,
    },
  });

  // 5. Seed Universities & Campuses
  // Technical University of Munich (TUM)
  const tum = await prisma.university.upsert({
    where: { domain: 'tum.de' },
    update: {},
    create: {
      name: 'Technical University of Munich (TUM)',
      domain: 'tum.de',
      primaryCountryId: germany.id,
      openAlexId: 'I68686616',
      rankingQs: 37,
      rankingTimes: 30,
    },
  });

  const tumMainCampus = await prisma.campus.create({
    data: {
      universityId: tum.id,
      countryId: germany.id,
      name: 'Munich Main Campus',
      city: 'Munich',
    },
  });

  // TU Delft
  const tudelft = await prisma.university.upsert({
    where: { domain: 'tudelft.nl' },
    update: {},
    create: {
      name: 'Delft University of Technology (TU Delft)',
      domain: 'tudelft.nl',
      primaryCountryId: netherlands.id,
      openAlexId: 'I10217961',
      rankingQs: 47,
      rankingTimes: 48,
    },
  });

  const tudelftCampus = await prisma.campus.create({
    data: {
      universityId: tudelft.id,
      countryId: netherlands.id,
      name: 'Delft Campus',
      city: 'Delft',
    },
  });

  // Imperial College London
  const imperial = await prisma.university.upsert({
    where: { domain: 'imperial.ac.uk' },
    update: {},
    create: {
      name: 'Imperial College London',
      domain: 'imperial.ac.uk',
      primaryCountryId: uk.id,
      openAlexId: 'I47508984',
      rankingQs: 6,
      rankingTimes: 8,
    },
  });

  const imperialCampus = await prisma.campus.create({
    data: {
      universityId: imperial.id,
      countryId: uk.id,
      name: 'South Kensington Campus',
      city: 'London',
    },
  });

  // MIT (US)
  const mit = await prisma.university.upsert({
    where: { domain: 'mit.edu' },
    update: {},
    create: {
      name: 'Massachusetts Institute of Technology (MIT)',
      domain: 'mit.edu',
      primaryCountryId: us.id,
      openAlexId: 'I63966007',
      rankingQs: 1,
      rankingTimes: 5,
    },
  });

  const mitCampus = await prisma.campus.create({
    data: {
      universityId: mit.id,
      countryId: us.id,
      name: 'Cambridge Campus',
      city: 'Cambridge',
    },
  });

  // Monash University (Multi-campus: Australia & Malaysia)
  const monash = await prisma.university.upsert({
    where: { domain: 'monash.edu' },
    update: {},
    create: {
      name: 'Monash University',
      domain: 'monash.edu',
      primaryCountryId: malaysia.id,
      openAlexId: 'I4210087498',
      rankingQs: 42,
      rankingTimes: 44,
    },
  });

  const monashMalaysiaCampus = await prisma.campus.create({
    data: {
      universityId: monash.id,
      countryId: malaysia.id,
      name: 'Sunway Campus (Malaysia)',
      city: 'Subang Jaya',
    },
  });

  // 6. Seed Academic Programs & Requirements
  // Program 1: TUM M.Sc. Informatics / Computer Science
  const tumCs = await prisma.program.create({
    data: {
      universityId: tum.id,
      campusId: tumMainCampus.id,
      title: 'M.Sc. Informatics (Computer Science)',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Computer Science',
      durationMonths: 24,
      language: 'English',
      tuitionFeeLocal: 6000.0, // Non-EU fee per semester e.g. ~3000 EUR x 4
      currencyCode: 'EUR',
      sourceUrl: 'https://www.cit.tum.de/en/cit/studies/degree-programs/master-informatics/',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: tumCs.id,
      minGpa: 3.2, // 4.0 scale equivalent
      minGpaOriginal: 2.5, // German scale where lower is better
      gpaScale: 4.0,
      minIelts: 6.5,
      minToefl: 88,
      minGre: 315,
      requiresPapers: false,
      minPapersCount: 0,
      sourceUrl: 'https://www.cit.tum.de/en/cit/studies/degree-programs/master-informatics/',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  // Tiered scholarship for TUM
  await prisma.scholarshipRule.create({
    data: {
      title: 'TUM International Merit Waiver Tiered Formula',
      scope: ScholarshipScope.PROGRAM,
      type: ScholarshipType.TIERED_FORMULA,
      coverageType: CoverageType.PARTIAL_PERCENT,
      programId: tumCs.id,
      fundingPctMin: 50.0,
      fundingPctMax: 100.0,
      tierCriteriaJson: [
        { minGpa: 3.5, fundingPct: 50.0, description: 'GPA >= 3.5 qualifies for 50% tuition waiver' },
        { minGpa: 3.8, fundingPct: 100.0, description: 'GPA >= 3.8 qualifies for 100% tuition waiver' },
      ],
      description: 'Published merit-based tuition waiver based on bachelor GPA.',
      sourceUrl: 'https://www.tum.de/en/studies/fees-and-financial-aid/scholarships',
      confidence: ConfidenceLevel.VERIFIED,
    },
  });

  // Program 2: TU Delft M.Sc. Computer Science
  const tudelftCs = await prisma.program.create({
    data: {
      universityId: tudelft.id,
      campusId: tudelftCampus.id,
      title: 'M.Sc. Computer Science',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Computer Science',
      durationMonths: 24,
      language: 'English',
      tuitionFeeLocal: 20500.0,
      currencyCode: 'EUR',
      sourceUrl: 'https://www.tudelft.nl/en/education/programmes/masters/computer-science/msc-computer-science',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: tudelftCs.id,
      minGpa: 3.4,
      minGpaOriginal: 80.0,
      gpaScale: 4.0,
      minIelts: 7.0,
      minToefl: 100,
      minGre: 320,
      requiresPapers: false,
      minPapersCount: 0,
      sourceUrl: 'https://www.tudelft.nl/en/education/admission-and-application',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  await prisma.scholarshipRule.create({
    data: {
      title: 'TU Delft Justus & Louise van Effen Excellence Scholarship',
      scope: ScholarshipScope.UNIVERSITY,
      type: ScholarshipType.HOLISTIC,
      coverageType: CoverageType.FULL_TUITION,
      universityId: tudelft.id,
      fundingPctMin: 100.0,
      fundingPctMax: 100.0,
      description: 'Full tuition coverage + monthly allowance for high-achieving international applicants.',
      sourceUrl: 'https://www.tudelft.nl/en/education/scholarships/justus-louise-van-effen-excellence-scholarships',
      confidence: ConfidenceLevel.VERIFIED,
    },
  });

  // Program 3: Imperial M.Sc. Advanced Computing
  const imperialCs = await prisma.program.create({
    data: {
      universityId: imperial.id,
      campusId: imperialCampus.id,
      title: 'M.Sc. Advanced Computing',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Computer Science',
      durationMonths: 12,
      language: 'English',
      tuitionFeeLocal: 39400.0,
      currencyCode: 'GBP',
      sourceUrl: 'https://www.imperial.ac.uk/study/courses/postgraduate-taught/advanced-computing/',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: imperialCs.id,
      minGpa: 3.6,
      minGpaOriginal: 3.6,
      gpaScale: 4.0,
      minIelts: 7.0,
      minToefl: 100,
      minGre: 322,
      requiresPapers: true,
      minPapersCount: 1,
      sourceUrl: 'https://www.imperial.ac.uk/computing/prospective-students/pg/msc-advanced-computing/',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  // Program 4: Monash Malaysia Master of Computer Science
  const monashCs = await prisma.program.create({
    data: {
      universityId: monash.id,
      campusId: monashMalaysiaCampus.id,
      title: 'Master of Computer Science (Research/Taught)',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Computer Science',
      durationMonths: 24,
      language: 'English',
      tuitionFeeLocal: 56000.0,
      currencyCode: 'MYR',
      sourceUrl: 'https://www.monash.edu.my/study/postgraduate/computer-science',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: monashCs.id,
      minGpa: 3.0,
      minGpaOriginal: 3.0,
      gpaScale: 4.0,
      minIelts: 6.5,
      minToefl: 79,
      minGre: null,
      requiresPapers: false,
      minPapersCount: 0,
      sourceUrl: 'https://www.monash.edu.my/study/postgraduate/computer-science',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  // Program 5: TUM M.Sc. Data Engineering & Analytics
  const tumDs = await prisma.program.create({
    data: {
      universityId: tum.id,
      campusId: tumMainCampus.id,
      title: 'M.Sc. Data Engineering and Analytics',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Data Science & AI',
      durationMonths: 24,
      language: 'English',
      tuitionFeeLocal: 6000.0,
      currencyCode: 'EUR',
      sourceUrl: 'https://www.cit.tum.de/en/cit/studies/degree-programs/master-data-engineering-analytics/',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: tumDs.id,
      minGpa: 3.3,
      minGpaOriginal: 2.3,
      gpaScale: 4.0,
      minIelts: 7.0,
      minToefl: 95,
      minGre: 320,
      requiresPapers: false,
      minPapersCount: 0,
      sourceUrl: 'https://www.cit.tum.de/en/cit/studies/degree-programs/master-data-engineering-analytics/',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  await prisma.scholarshipRule.create({
    data: {
      title: 'TUM Data Science Excellence Grant',
      scope: ScholarshipScope.PROGRAM,
      type: ScholarshipType.TUITION_WAIVER,
      coverageType: CoverageType.FULL_TUITION,
      programId: tumDs.id,
      fundingPctMin: 100.0,
      fundingPctMax: 100.0,
      description: '100% tuition waiver for top 5% applicants in Data Engineering.',
      sourceUrl: 'https://www.tum.de/en/studies/fees-and-financial-aid/scholarships',
      confidence: ConfidenceLevel.VERIFIED,
    },
  });

  // Program 6: TU Delft M.Sc. Electrical Engineering
  const tudelftEe = await prisma.program.create({
    data: {
      universityId: tudelft.id,
      campusId: tudelftCampus.id,
      title: 'M.Sc. Electrical Engineering',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Electrical Engineering',
      durationMonths: 24,
      language: 'English',
      tuitionFeeLocal: 20500.0,
      currencyCode: 'EUR',
      sourceUrl: 'https://www.tudelft.nl/en/education/programmes/masters/electrical-engineering',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: tudelftEe.id,
      minGpa: 3.2,
      minGpaOriginal: 75.0,
      gpaScale: 4.0,
      minIelts: 6.5,
      minToefl: 90,
      minGre: 315,
      requiresPapers: false,
      minPapersCount: 0,
      sourceUrl: 'https://www.tudelft.nl/en/education/admission-and-application',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  // Program 7: Imperial M.Sc. Financial Technology & Analytics
  const imperialFintech = await prisma.program.create({
    data: {
      universityId: imperial.id,
      campusId: imperialCampus.id,
      title: 'M.Sc. Financial Technology & Business Analytics',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Business Analytics',
      durationMonths: 12,
      language: 'English',
      tuitionFeeLocal: 42000.0,
      currencyCode: 'GBP',
      sourceUrl: 'https://www.imperial.ac.uk/business-school/programmes/msc-financial-technology/',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: imperialFintech.id,
      minGpa: 3.5,
      minGpaOriginal: 3.5,
      gpaScale: 4.0,
      minIelts: 7.5,
      minToefl: 105,
      minGre: 325,
      requiresPapers: false,
      minPapersCount: 0,
      sourceUrl: 'https://www.imperial.ac.uk/business-school/programmes/msc-financial-technology/admissions/',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  await prisma.scholarshipRule.create({
    data: {
      title: 'Imperial Business School Dean’s Excellence Award',
      scope: ScholarshipScope.PROGRAM,
      type: ScholarshipType.HOLISTIC,
      coverageType: CoverageType.PARTIAL_PERCENT,
      programId: imperialFintech.id,
      fundingPctMin: 50.0,
      fundingPctMax: 50.0,
      description: '50% tuition reduction for candidates with outstanding academic merit.',
      sourceUrl: 'https://www.imperial.ac.uk/business-school/programmes/msc-financial-technology/fees-and-funding/',
      confidence: ConfidenceLevel.VERIFIED,
    },
  });

  // Program 8: MIT Master of Business Analytics (MBAn)
  const mitMban = await prisma.program.create({
    data: {
      universityId: mit.id,
      campusId: mitCampus.id,
      title: 'Master of Business Analytics (MBAn)',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Business Analytics',
      durationMonths: 12,
      language: 'English',
      tuitionFeeLocal: 86000.0,
      currencyCode: 'USD',
      sourceUrl: 'https://mitsloan.mit.edu/mban',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: mitMban.id,
      minGpa: 3.7,
      minGpaOriginal: 3.7,
      gpaScale: 4.0,
      minIelts: 7.5,
      minToefl: 105,
      minGre: 328,
      requiresPapers: true,
      minPapersCount: 1,
      sourceUrl: 'https://mitsloan.mit.edu/mban/admissions',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  // Program 9: TU Delft M.Sc. Sustainable Energy Technology
  const tudelftEnergy = await prisma.program.create({
    data: {
      universityId: tudelft.id,
      campusId: tudelftCampus.id,
      title: 'M.Sc. Sustainable Energy Technology',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Environmental Science',
      durationMonths: 24,
      language: 'English',
      tuitionFeeLocal: 20500.0,
      currencyCode: 'EUR',
      sourceUrl: 'https://www.tudelft.nl/en/education/programmes/masters/sustainable-energy-technology',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: tudelftEnergy.id,
      minGpa: 3.1,
      minGpaOriginal: 75.0,
      gpaScale: 4.0,
      minIelts: 6.5,
      minToefl: 90,
      minGre: null,
      requiresPapers: false,
      minPapersCount: 0,
      sourceUrl: 'https://www.tudelft.nl/en/education/admission-and-application',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  // Program 10: TUM M.Sc. Biomedical Engineering
  const tumBio = await prisma.program.create({
    data: {
      universityId: tum.id,
      campusId: tumMainCampus.id,
      title: 'M.Sc. Biomedical Engineering and Medical Physics',
      degreeLevel: DegreeLevel.MS,
      fieldOfStudy: 'Biomedical Engineering',
      durationMonths: 24,
      language: 'English',
      tuitionFeeLocal: 6000.0,
      currencyCode: 'EUR',
      sourceUrl: 'https://www.nat.tum.de/en/nat/studies/degree-programs/master-biomedical-engineering/',
    },
  });

  await prisma.programRequirement.create({
    data: {
      programId: tumBio.id,
      minGpa: 3.2,
      minGpaOriginal: 2.5,
      gpaScale: 4.0,
      minIelts: 6.5,
      minToefl: 88,
      minGre: 312,
      requiresPapers: false,
      minPapersCount: 0,
      sourceUrl: 'https://www.nat.tum.de/en/nat/studies/degree-programs/master-biomedical-engineering/',
      confidence: ConfidenceLevel.VERIFIED,
      validFrom: new Date('2024-01-01'),
    },
  });

  // 7. Seed Crowdsourced Outcome Reports
  await prisma.outcomeReport.createMany({
    data: [
      {
        userAnonHash: 'anon_hash_sample_1',
        programId: tumCs.id,
        reportedGpa: 3.65,
        reportedGpaScale: 4.0,
        reportedIelts: 7.5,
        reportedGre: 324,
        reportedPapersCount: 1,
        scholarshipPctReceived: 50.0,
        admitCycleYear: 2024,
        verificationStatus: OutcomeVerificationStatus.VERIFIED,
      },
      {
        userAnonHash: 'anon_hash_sample_2',
        programId: tumCs.id,
        reportedGpa: 3.85,
        reportedGpaScale: 4.0,
        reportedIelts: 8.0,
        reportedGre: 330,
        reportedPapersCount: 2,
        scholarshipPctReceived: 100.0,
        admitCycleYear: 2024,
        verificationStatus: OutcomeVerificationStatus.VERIFIED,
      },
      {
        userAnonHash: 'anon_hash_sample_3',
        programId: tudelftCs.id,
        reportedGpa: 3.75,
        reportedGpaScale: 4.0,
        reportedIelts: 7.5,
        reportedGre: 325,
        reportedPapersCount: 1,
        scholarshipPctReceived: 100.0,
        admitCycleYear: 2023,
        verificationStatus: OutcomeVerificationStatus.VERIFIED,
      },
      {
        userAnonHash: 'anon_hash_sample_4',
        programId: imperialCs.id,
        reportedGpa: 3.9,
        reportedGpaScale: 4.0,
        reportedIelts: 8.5,
        reportedGre: 332,
        reportedPapersCount: 3,
        scholarshipPctReceived: 25.0,
        admitCycleYear: 2024,
        verificationStatus: OutcomeVerificationStatus.VERIFIED,
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
