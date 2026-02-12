export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

export function parseDate(dateString: string): Date {
  const [month, day, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`);
}

export function getUpcomingBirthdays(recipients: any[], daysAhead: number = 60) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return recipients
    .map((recipient) => {
      const birthday = new Date(recipient.birthday);
      let nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

      if (nextBirthday < today) {
        nextBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
      }

      const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...recipient,
        nextBirthday,
        daysUntil,
      };
    })
    .filter((r) => r.daysUntil <= daysAhead && r.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export function getNextBirthday(birthDate: string): { date: Date; daysUntil: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const birthday = new Date(birthDate);
  let nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
  }

  const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return { date: nextBirthday, daysUntil };
}
