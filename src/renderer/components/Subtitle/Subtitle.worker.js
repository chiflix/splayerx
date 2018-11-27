import iso6393 from 'iso-639-3';

/* eslint-disable import/prefer-default-export */
export function findISO6393Locale(identifier) {
  return (iso6393.filter(lang => lang.iso6393 === identifier))[0].name;
}
