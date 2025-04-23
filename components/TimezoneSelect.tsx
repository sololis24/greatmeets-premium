'use client';

import Select from 'react-select';
import { useState, useEffect } from 'react';

type Option = {
  label: string;
  value: string;
};

type GroupedOption = {
  label: string;
  options: Option[];
};

type Props = {
  value: string;
  onChange: (value: string) => void;
};

// Grouped timezones list (same as before)
const timezonesGrouped: GroupedOption[] = [
  {
    label: 'North America',
    options: [
      { label: 'Los Angeles (PST)', value: 'America/Los_Angeles' },
      { label: 'Denver (MT)', value: 'America/Denver' },
      { label: 'Chicago (CST)', value: 'America/Chicago' },
      { label: 'New York (EST)', value: 'America/New_York' },
      { label: 'Toronto (EST)', value: 'America/Toronto' },
      { label: 'Anchorage (AKST)', value: 'America/Anchorage' },
      { label: 'Honolulu (HST)', value: 'Pacific/Honolulu' },
    ],
  },
  {
    label: 'Central America',
    options: [
      { label: 'Mexico City (CST)', value: 'America/Mexico_City' },
      { label: 'Costa Rica (CST)', value: 'America/Costa_Rica' },
      { label: 'Tegucigalpa (CST)', value: 'America/Tegucigalpa' },
    ],
  },
  {
    label: 'South America',
    options: [
      { label: 'Bogota (COT)', value: 'America/Bogota' },
      { label: 'Buenos Aires (ART)', value: 'America/Argentina/Buenos_Aires' },
      { label: 'Sao Paulo (BRT)', value: 'America/Sao_Paulo' },
    ],
  },
  {
    label: 'Europe',
    options: [
      { label: 'London (GMT)', value: 'Europe/London' },
      { label: 'Madrid (CET)', value: 'Europe/Madrid' },
      { label: 'Paris (CET)', value: 'Europe/Paris' },
      { label: 'Berlin (CET)', value: 'Europe/Berlin' },
      { label: 'Rome (CET)', value: 'Europe/Rome' },
      { label: 'Amsterdam (CET)', value: 'Europe/Amsterdam' },
      { label: 'Istanbul (TRT)', value: 'Europe/Istanbul' },
      { label: 'Kyiv (EET)', value: 'Europe/Kyiv' },
    ],
  },
  {
    label: 'Africa',
    options: [
      { label: 'Cairo (EET)', value: 'Africa/Cairo' },
      { label: 'Cape Town (SAST)', value: 'Africa/Johannesburg' },
      { label: 'Lagos (WAT)', value: 'Africa/Lagos' },
      { label: 'Nairobi (EAT)', value: 'Africa/Nairobi' },
    ],
  },
  {
    label: 'Middle East',
    options: [
      { label: 'Dubai (GST)', value: 'Asia/Dubai' },
      { label: 'Riyadh (AST)', value: 'Asia/Riyadh' },
      { label: 'Tehran (IRST)', value: 'Asia/Tehran' },
    ],
  },
  {
    label: 'Asia',
    options: [
      { label: 'Mumbai (IST)', value: 'Asia/Kolkata' },
      { label: 'Karachi (PKT)', value: 'Asia/Karachi' },
      { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
      { label: 'Bangkok (ICT)', value: 'Asia/Bangkok' },
      { label: 'Jakarta (WIB)', value: 'Asia/Jakarta' },
      { label: 'Hong Kong (HKT)', value: 'Asia/Hong_Kong' },
      { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
      { label: 'Seoul (KST)', value: 'Asia/Seoul' },
      { label: 'Manila (PHT)', value: 'Asia/Manila' },
      { label: 'Beijing (CST)', value: 'Asia/Shanghai' },
    ],
  },
  {
    label: 'Oceania',
    options: [
      { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
      { label: 'Auckland (NZST)', value: 'Pacific/Auckland' },
    ],
  },
];

export default function TimezoneSelect({ value, onChange }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <select disabled className="w-full p-3 border rounded-lg bg-gray-100 italic">
        <option>Loading timezones...</option>
      </select>
    );
  }

  const selectedOption =
    timezonesGrouped.flatMap(group => group.options).find(opt => opt.value === value) || null;

  return (
    <Select
      value={selectedOption}
      onChange={(option) => onChange(option?.value ?? '')}
      options={timezonesGrouped}
      isClearable
      placeholder="Select their timezone"
      className="text-black"
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          fontSize: '16px',
        }),
        singleValue: (base) => ({
          ...base,
          fontSize: '16px',
          fontStyle: 'italic',
        }),
        placeholder: (base) => ({
          ...base,
          fontSize: '16px',
          fontStyle: 'italic',
        }),
        option: (base) => ({
          ...base,
          fontSize: '16px',
        }),
        menu: (base) => ({
          ...base,
          fontSize: '16px',
        }),
      }}
      
    />
  );
}
