import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export function useSkills() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getSkills()
            .then(data => {
                setSkills(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return { skills, loading };
}
