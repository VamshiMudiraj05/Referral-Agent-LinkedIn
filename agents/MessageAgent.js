class MessageAgent {
  constructor() {
    this.maxNoteLength = 300; // Standard LinkedIn connection note limit
  }

  extractFirstName(fullName = '') {
    if (!fullName) return '';
    let cleaned = fullName.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    cleaned = cleaned.replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.|engr\.)\s+/i, '');
    cleaned = cleaned.replace(/\(.*?\)/g, '');
    cleaned = cleaned.split(',')[0].split('|')[0].trim();
    const parts = cleaned.trim().split(/\s+/);
    let firstName = parts[0] || '';
    if (firstName.length > 0) {
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
    return firstName;
  }

  generateMessage(template, candidate = {}, companyName = '') {
    if (!template) {
      template = "Hi, I came across opportunities at [Company] and would really appreciate connecting. If you find my profile relevant, I'd be grateful for any referral or guidance regarding suitable openings. Thanks!";
    }

    const company = companyName || candidate.company || 'your team';

    let message = template;

    // 1. Substitute Company tokens first
    message = message
      .replace(/\[Company\]/gi, company)
      .replace(/\[Company Name\]/gi, company)
      .replace(/\[CompanyName\]/gi, company)
      .replace(/\{Company\}/gi, company);

    // 2. Per user requirement: Do NOT include person's name in greetings to respect seniority levels.
    // Clean greetings like "Hi [First Name],", "Hello [Name],", "Hey [First Name],", "Dear [Name]," -> "Hi," or "Hello,"
    message = message
      .replace(/Hi\s*(\[[^\]]+\]|\{[^\}]+\}|\<[^\>]+\>)\s*,?/gi, 'Hi,')
      .replace(/Hello\s*(\[[^\]]+\]|\{[^\}]+\}|\<[^\>]+\>)\s*,?/gi, 'Hello,')
      .replace(/Hey\s*(\[[^\]]+\]|\{[^\}]+\}|\<[^\>]+\>)\s*,?/gi, 'Hi,')
      .replace(/Dear\s*(\[[^\]]+\]|\{[^\}]+\}|\<[^\>]+\>)\s*,?/gi, 'Hi,');

    // If candidate has a name, also ensure any literal greeting with that name is converted to "Hi,"
    if (candidate.personName) {
      const firstName = this.extractFirstName(candidate.personName);
      if (firstName && firstName.length > 1) {
        const nameRegex = new RegExp(`(Hi|Hello|Hey)\\s+${firstName}\\s*,?`, 'gi');
        message = message.replace(nameRegex, '$1,');
      }
    }

    // Strip any remaining standalone name tags anywhere in the body
    message = message
      .replace(/\[\s*(First\s*Name|FirstName|First_Name|Name|Full\s*Name|FullName)\s*\]/gi, '')
      .replace(/\{\s*(First\s*Name|FirstName|First_Name|Name|Full\s*Name|FullName)\s*\}/gi, '')
      .replace(/\<\s*(First\s*Name|FirstName|First_Name|Name|Full\s*Name|FullName)\s*\>/gi, '');

    // 3. Clean up formatting and spacing
    message = message
      .replace(/Hi\s+,/g, 'Hi,')
      .replace(/Hello\s+,/g, 'Hello,')
      .replace(/Hey\s+,/g, 'Hi,')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const length = message.length;
    const isOverLimit = length > this.maxNoteLength;

    return {
      message,
      charCount: length,
      isOverLimit,
      charLimit: this.maxNoteLength
    };
  }

  validateMessageLength(message) {
    return {
      length: message.length,
      isValid: message.length <= this.maxNoteLength,
      remaining: this.maxNoteLength - message.length
    };
  }
}

module.exports = MessageAgent;
