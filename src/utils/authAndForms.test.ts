import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emailToProfileId,
  isValidEmail,
  normalizeEmail,
  validateAuthInput,
  validateContactInput,
  validateNewsletterEmail,
} from './authAndForms';

test('normalizeEmail and emailToProfileId produce deterministic valid Firestore/URL IDs', () => {
  assert.equal(normalizeEmail('  Aarav.Sharma@Example.COM '), 'aarav.sharma@example.com');
  assert.equal(isValidEmail('learner@akujin.jp'), true);
  assert.equal(isValidEmail('invalid-email'), false);

  const id1 = emailToProfileId('Learner@Example.com');
  const id2 = emailToProfileId('  learner@example.com ');
  assert.equal(id1, id2);
  assert.match(id1, /^[a-zA-Z0-9_-]+$/);
  assert.notEqual(id1, emailToProfileId('other@example.com'));
});

test('validateAuthInput enforces email, name on signup, and password length', () => {
  assert.equal(
    validateAuthInput({ mode: 'signup', name: 'A', email: 'a@b.com', password: 'password123' }).ok,
    false
  );
  assert.equal(
    validateAuthInput({ mode: 'signup', name: 'Ananya', email: 'bad', password: 'password123' }).ok,
    false
  );
  assert.equal(
    validateAuthInput({ mode: 'login', email: 'ananya@example.com', password: '123' }).ok,
    false
  );
  assert.equal(
    validateAuthInput({ mode: 'signup', name: 'Ananya', email: 'ananya@example.com', password: 'password123' }).ok,
    true
  );
});

test('validateContactInput validates name, email, mobile digits, and message length', () => {
  assert.equal(
    validateContactInput({
      name: 'Rohan',
      email: 'rohan@example.com',
      mobile: '123',
      message: 'Need guidance for JLPT N5 schedule.',
    }).ok,
    false
  );
  assert.equal(
    validateContactInput({
      name: 'Rohan',
      email: 'rohan@example.com',
      mobile: '+91 98765 43210',
      message: 'Hi',
    }).ok,
    false
  );
  assert.equal(
    validateContactInput({
      name: 'Rohan Verma',
      email: 'rohan@example.com',
      mobile: '+91 98765 43210',
      message: 'Can I sync my N5 Kanji progress across mobile and laptop?',
    }).ok,
    true
  );
});

test('validateNewsletterEmail accepts normalized emails and rejects malformed input', () => {
  const valid = validateNewsletterEmail('  TEST@AkuJin.jp ');
  assert.equal(valid.ok, true);
  if (valid.ok) assert.equal(valid.email, 'test@akujin.jp');

  assert.equal(validateNewsletterEmail('not-an-email').ok, false);
});
