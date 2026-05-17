const OVERRIDES = {
  'Argentina':           'ARG',
  'France':              'FRA',
  'Brazil':              'BRA',
  'Germany':             'GER',
  'Spain':               'ESP',
  'England':             'ENG',
  'Italy':               'ITA',
  'Netherlands':         'NED',
  'Portugal':            'POR',
  'Belgium':             'BEL',
  'Croatia':             'CRO',
  'Uruguay':             'URU',
  'Colombia':            'COL',
  'Mexico':              'MEX',
  'United States':       'USA',
  'South Korea':         'KOR',
  'Japan':               'JPN',
  'Australia':           'AUS',
  'Senegal':             'SEN',
  'Morocco':             'MAR',
  'Real Madrid':         'RMA',
  'Barcelona':           'BAR',
  'Manchester City':     'MCI',
  'Manchester United':   'MUN',
  'Liverpool':           'LIV',
  'Chelsea':             'CHE',
  'Arsenal':             'ARS',
  'Tottenham Hotspur':   'TOT',
  'Bayern Munich':       'BAY',
  'Borussia Dortmund':   'BVB',
  'Paris Saint-Germain': 'PSG',
  'Juventus':            'JUV',
  'Inter Milan':         'INT',
  'AC Milan':            'MIL',
  'Atletico Madrid':     'ATM',
  'Sevilla':             'SEV',
};

export function abbrev(teamName, length = 3) {
  if (!teamName) return '???';
  if (OVERRIDES[teamName]) return OVERRIDES[teamName];
  return teamName.slice(0, length).toUpperCase();
}
