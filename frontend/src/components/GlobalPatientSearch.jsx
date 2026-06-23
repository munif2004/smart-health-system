import React, { useEffect, useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { searchAPI } from '../utils/api';
import './GlobalPatientSearch.css';

const highlight = (value = '', query = '') => {
  if (!query) return value;
  const index = value.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return value;

  return (
    <>
      {value.slice(0, index)}
      <mark>{value.slice(index, index + query.length)}</mark>
      {value.slice(index + query.length)}
    </>
  );
};

const GlobalPatientSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 500);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setPatients([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    searchAPI.searchPatients(debouncedQuery)
      .then((response) => {
        if (!cancelled) setPatients(response.data.patients || []);
      })
      .catch(() => {
        if (!cancelled) setPatients([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const visible = useMemo(() => query.trim().length >= 2 && (patients.length > 0 || loading), [query, patients, loading]);

  return (
    <div className="global-patient-search">
      <label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search patient name, email, phone, ID..."
        />
        <FiSearch />
      </label>
      {visible && (
        <div className="patient-search-results">
          {loading && <div className="patient-search-empty">Searching...</div>}
          {!loading && patients.map((patient) => (
            <button
              key={patient._id}
              type="button"
              onClick={() => {
                onSelect?.(patient);
                setQuery(patient.name);
                setPatients([]);
              }}
            >
              <strong>{highlight(patient.name || 'Unnamed patient', query)}</strong>
              <span>{highlight(patient.email || patient.phone || patient._id, query)}</span>
            </button>
          ))}
          {!loading && patients.length === 0 && <div className="patient-search-empty">No patients found</div>}
        </div>
      )}
    </div>
  );
};

const useDebouncedValue = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default GlobalPatientSearch;
