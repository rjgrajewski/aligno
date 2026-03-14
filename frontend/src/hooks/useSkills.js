import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';

const MOCK_SKILLS = [
  { name: 'React', frequency: 154 },
  { name: 'Python', frequency: 120 },
  { name: 'JavaScript', frequency: 110 },
  { name: 'TypeScript', frequency: 95 },
  { name: 'Node.js', frequency: 80 },
  { name: 'Framer Motion', frequency: 75 },
  { name: 'CSS', frequency: 150 },
  { name: 'HTML', frequency: 140 },
  { name: 'SQL', frequency: 100 },
  { name: 'AWS', frequency: 90 },
];

export function useSkills(selected = []) {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const hasLoaded = useRef(false);

    const selectedStr = selected.join(',');

    useEffect(() => {
        if (skills.length === 0) setLoading(true);

        const timeoutId = setTimeout(() => {
            api.getSkills(selectedStr ? selectedStr.split(',') : [])
                .then(data => {
                    hasLoaded.current = true;
                    setSkills(data);
                    setLoading(false);
                })
                .catch(() => {
                    // Only fall back to mocks if we never loaded real data
                    if (!hasLoaded.current) {
                        setSkills(MOCK_SKILLS);
                    }
                    setLoading(false);
                });
        }, 150);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStr]);

    return { skills, loading };
}
