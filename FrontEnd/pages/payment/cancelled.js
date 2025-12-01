import Link from 'next/link';

export default function Cancelled() {
  return (
    <main style={{padding:24}}>
      <h1>Paiement annulé</h1>
      <p>Tu peux réessayer quand tu veux.</p>
      <Link href="/">Retour à l’accueil</Link>
    </main>
  );
}