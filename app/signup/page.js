import SignupForm from './SignupForm';

// Τα κουμπιά της αρχικής στέλνουν ?type=personal ή ?type=coach για να είναι ήδη επιλεγμένος ο τύπος.
export default async function SignupPage({ searchParams }) {
  const { type } = await searchParams;
  return <SignupForm initialType={type === 'coach' ? 'coach' : 'personal'} />;
}
