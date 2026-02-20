import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export function useOffers() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getOffers()
            .then(data => {
                setOffers(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return { offers, loading };
}
