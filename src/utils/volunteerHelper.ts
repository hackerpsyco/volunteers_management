/**
 * Utility helper to generate Volunteer ID based on formula:
 * Volunteer Name + Company (first 2 letters) + City + Role Short Code (GT / GS / LT)
 */
export function generateVolunteerId(v: {
  name?: string | null;
  organization_name?: string | null;
  organization_type?: string | null;
  city?: string | null;
  preference?: string | null;
  role_session?: string | null;
}): string {
  const name = (v.name || 'Volunteer').trim();
  
  let companyCode = 'NA';
  if (v.organization_type === 'individual') {
    companyCode = 'SE';
  } else if (v.organization_name && v.organization_name.trim()) {
    companyCode = v.organization_name.trim().slice(0, 2).toUpperCase();
  }

  let city = (v.city || 'NA').trim();
  city = city ? city.charAt(0).toUpperCase() + city.slice(1) : 'NA';

  let roleShort = 'GT';
  const pref = (v.preference || v.role_session || '').toLowerCase();
  if (pref.includes('speaker')) {
    roleShort = 'GS';
  } else if (pref.includes('local')) {
    roleShort = 'LT';
  } else if (pref.includes('teacher')) {
    roleShort = 'GT';
  }

  return `${name}-${companyCode}-${city}-${roleShort}`;
}
