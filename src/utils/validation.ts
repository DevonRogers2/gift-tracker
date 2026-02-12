export function validateName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }
  if (name.length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (name.length > 50) {
    return 'Name must not exceed 50 characters';
  }
  return null;
}

export function validateBirthday(date: string): string | null {
  if (!date) {
    return 'Birthday is required';
  }
  const birthdayDate = new Date(date);
  const today = new Date();
  if (birthdayDate > today) {
    return 'Birthday cannot be in the future';
  }
  return null;
}

export function validateNotes(notes: string): string | null {
  if (notes.length > 500) {
    return 'Notes must not exceed 500 characters';
  }
  return null;
}

export function validateTags(tags: string): string | null {
  if (tags.length > 500) {
    return 'Tags must not exceed 500 characters';
  }
  return null;
}

export function validateGiftIdea(title: string, cost: number): string | null {
  if (!title || title.trim().length === 0) {
    return 'Gift idea title is required';
  }
  if (title.length > 200) {
    return 'Title must not exceed 200 characters';
  }
  if (cost < 0) {
    return 'Cost cannot be negative';
  }
  return null;
}
