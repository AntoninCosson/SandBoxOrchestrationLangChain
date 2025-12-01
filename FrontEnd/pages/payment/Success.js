import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!session_id) return;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/payments/session/${session_id}`);
        const data = await r.json();
        if (data.result) setSummary(data);
      } catch (e) {}
      setTimeout(() => {
        router.replace(`/mon-panier?thanks=1&session_id=${session_id}`);
      }, 2000);
    })();
  }, [session_id]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.iconWrap}>
          <span style={styles.iconCircle}/>
          <span style={styles.iconCheck}>✓</span>
        </div>
        <h2 style={{marginTop:16}}>Paiement confirmé</h2>
        <p>Merci {summary?.customer_email ? `(${summary.customer_email})` : ''}.</p>
        <small>Redirection…</small>
      </div>
      <style jsx>{`
        @keyframes pulseColor {
          0% { background:#d32f2f; } 60% { background:#f57c00; } 100% { background:#2e7d32; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay:{position:'fixed',inset:0,display:'grid',placeItems:'center',background:'rgba(0,0,0,.4)'},
  modal:{width:360,background:'#fff',borderRadius:12,padding:'24px 20px',textAlign:'center',boxShadow:'0 10px 30px rgba(0,0,0,.2)'},
  iconWrap:{position:'relative',width:80,height:80,margin:'0 auto'},
  iconCircle:{position:'absolute',inset:0,borderRadius:'50%',animation:'pulseColor 1.8s ease forwards'},
  iconCheck:{position:'absolute',inset:0,display:'grid',placeItems:'center',fontSize:40,color:'#fff',fontWeight:700},
};