import { useEffect, useState } from 'react';
import { listenToCollection } from '../firebase/firestore';

export default function useCollection(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToCollection(
      collectionName,
      (items) => {
        setData(items);
        setError('');
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [collectionName]);

  return { data, loading, error };
}
