export type PersonPalette = {
  ink: string;
  wash: string;
  mist: string;
  cloud: string;
};

const personPalettes = [
  {
    ink: '#446055',
    wash: 'rgba(128, 170, 150, 0.72)',
    mist: 'rgba(128, 170, 150, 0.18)',
    cloud: 'rgba(168, 204, 191, 0.24)',
  },
  {
    ink: '#7b5f4e',
    wash: 'rgba(192, 160, 132, 0.72)',
    mist: 'rgba(192, 160, 132, 0.18)',
    cloud: 'rgba(214, 186, 164, 0.22)',
  },
  {
    ink: '#516681',
    wash: 'rgba(131, 154, 191, 0.72)',
    mist: 'rgba(131, 154, 191, 0.18)',
    cloud: 'rgba(171, 189, 221, 0.24)',
  },
  {
    ink: '#6d5b7b',
    wash: 'rgba(166, 142, 186, 0.72)',
    mist: 'rgba(166, 142, 186, 0.18)',
    cloud: 'rgba(204, 184, 220, 0.23)',
  },
  {
    ink: '#6b6551',
    wash: 'rgba(165, 159, 121, 0.72)',
    mist: 'rgba(165, 159, 121, 0.18)',
    cloud: 'rgba(208, 204, 176, 0.24)',
  },
  {
    ink: '#6b5867',
    wash: 'rgba(188, 154, 182, 0.72)',
    mist: 'rgba(188, 154, 182, 0.18)',
    cloud: 'rgba(220, 194, 213, 0.24)',
  },
] as const satisfies ReadonlyArray<PersonPalette>;

export function getPersonPalette(index: number): PersonPalette {
  return personPalettes[index % personPalettes.length] ?? personPalettes[0];
}
