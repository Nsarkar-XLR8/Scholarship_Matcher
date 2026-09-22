/**
 * Generates an RFC-5545 compliant .ics iCalendar file string for application milestones
 */
export function generateIcsMilestoneCalendar(
  programTitle: string,
  universityName: string,
  milestones: {
    languageTestBy: string;
    documentLegalizationBy: string;
    portalSubmissionWindow: string;
    expectedDecisionDate: string;
    visaAppointmentBy: string;
  }
): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const parseToIcsDate = (dateStr: string, defaultMonthsAhead = 3): string => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      }
    } catch (_) {}
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + defaultMonthsAhead);
    return fallback.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const events = [
    {
      title: `[Language Test] Take IELTS/TOEFL for ${universityName}`,
      desc: `Complete English proficiency testing for ${programTitle} at ${universityName}. Target date: ${milestones.languageTestBy}`,
      date: parseToIcsDate(milestones.languageTestBy, 2),
    },
    {
      title: `[Documents & Legalization] Certified Transcripts for ${universityName}`,
      desc: `Get university transcripts notarized, apostilled, or APS verified for ${universityName}. Target date: ${milestones.documentLegalizationBy}`,
      date: parseToIcsDate(milestones.documentLegalizationBy, 3),
    },
    {
      title: `[Application Portal] Submission Window for ${universityName}`,
      desc: `Submit online application and scholarship forms for ${programTitle}. Window: ${milestones.portalSubmissionWindow}`,
      date: parseToIcsDate(milestones.portalSubmissionWindow.split('-')[0] || milestones.portalSubmissionWindow, 4),
    },
    {
      title: `[Admissions Decision] Check Results for ${universityName}`,
      desc: `Anticipated admission offer & scholarship notification date: ${milestones.expectedDecisionDate}`,
      date: parseToIcsDate(milestones.expectedDecisionDate, 6),
    },
    {
      title: `[Visa Appointment] Embassy Interview for ${universityName}`,
      desc: `Schedule visa interview and verify blocked account funds. Target date: ${milestones.visaAppointmentBy}`,
      date: parseToIcsDate(milestones.visaAppointmentBy, 7),
    },
  ];

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScholarMatch//Global Masters Milestone Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ScholarMatch Milestones - ' + universityName,
  ];

  events.forEach((ev, idx) => {
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:scholarmatch-${Date.now()}-${idx}@scholarmatch.io`,
      `DTSTAMP:${now}`,
      `DTSTART:${ev.date}`,
      `DTEND:${ev.date}`,
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${ev.desc}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P3D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${ev.title}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
}

/**
 * Initiates browser download of .ics calendar file
 */
export function downloadIcsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Creates Google Calendar direct web URL for primary submission deadline
 */
export function createGoogleCalendarUrl(
  title: string,
  details: string,
  location: string,
  dateStr: string
): string {
  const cleanDate = dateStr.replace(/[^0-9a-zA-Z]/g, '');
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', title);
  url.searchParams.append('details', details);
  url.searchParams.append('location', location);
  return url.toString();
}
