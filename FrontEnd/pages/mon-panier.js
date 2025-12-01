// FrontEnd/pages/mon-panier.js
import dynamic from 'next/dynamic';

const CartView = dynamic(() => import('../components/CartView'), { ssr: false });

export default function MonPanierPage() {
  return <CartView />;
}