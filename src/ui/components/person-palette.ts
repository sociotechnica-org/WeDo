export type PersonPalette = {
  ink: string;
  wash: string;
  mist: string;
  cloud: string;
};

const personPalettes = [
  {
    ink: '#455d52',
    wash: 'rgba(93, 151, 206, 0.96)',
    mist: 'rgba(93, 151, 206, 0.18)',
    cloud: 'rgba(160, 190, 178, 0.24)',
  },
  {
    ink: '#765d49',
    wash: 'rgba(93, 151, 206, 0.96)',
    mist: 'rgba(93, 151, 206, 0.18)',
    cloud: 'rgba(212, 189, 167, 0.23)',
  },
  {
    ink: '#596f85',
    wash: 'rgba(93, 151, 206, 0.96)',
    mist: 'rgba(93, 151, 206, 0.18)',
    cloud: 'rgba(175, 193, 214, 0.25)',
  },
  {
    ink: '#66735d',
    wash: 'rgba(93, 151, 206, 0.96)',
    mist: 'rgba(93, 151, 206, 0.18)',
    cloud: 'rgba(179, 194, 175, 0.24)',
  },
  {
    ink: '#6c624f',
    wash: 'rgba(93, 151, 206, 0.96)',
    mist: 'rgba(93, 151, 206, 0.18)',
    cloud: 'rgba(206, 199, 173, 0.24)',
  },
  {
    ink: '#5f6d78',
    wash: 'rgba(93, 151, 206, 0.96)',
    mist: 'rgba(93, 151, 206, 0.18)',
    cloud: 'rgba(188, 200, 210, 0.24)',
  },
] as const satisfies ReadonlyArray<PersonPalette>;

export function getPersonPalette(index: number): PersonPalette {
  return personPalettes[index % personPalettes.length] ?? personPalettes[0];
}
