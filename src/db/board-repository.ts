import { boardSnapshotSchema, type BoardSnapshot } from '@/types/board';

const scaffoldBoardSeed = boardSnapshotSchema.parse({
  dayLabel: 'Tuesday, April 7',
  householdName: 'Maple House',
  columns: [
    {
      id: 'alex',
      name: 'Alex',
      ink: '#4d665a',
      wash: 'rgba(135, 178, 158, 0.34)',
      completionRatio: 0.66,
      tasks: [
        {
          id: 'alex-breakfast',
          title: 'Breakfast table',
          note: 'Bowls nested, cloth shaken outside.',
          completed: true,
        },
        {
          id: 'alex-plants',
          title: 'Windowsill plants',
          note: 'Only the thirsty ones today.',
          completed: false,
        },
        {
          id: 'alex-piano',
          title: 'Piano practice',
          note: 'One quiet run-through before dinner.',
          completed: true,
        },
      ],
    },
    {
      id: 'mira',
      name: 'Mira',
      ink: '#745b48',
      wash: 'rgba(190, 156, 132, 0.33)',
      completionRatio: 0.33,
      tasks: [
        {
          id: 'mira-laundry',
          title: 'Fold laundry',
          note: 'Warm stack waiting by the sofa arm.',
          completed: false,
        },
        {
          id: 'mira-snacks',
          title: 'Snack drawer',
          note: 'Refill fruit bars and crackers.',
          completed: false,
        },
        {
          id: 'mira-reading',
          title: 'Reading nook reset',
          note: 'Blanket straightened, lamp clicked off.',
          completed: true,
        },
      ],
    },
    {
      id: 'noah',
      name: 'Noah',
      ink: '#4f617a',
      wash: 'rgba(128, 153, 198, 0.28)',
      completionRatio: 1,
      tasks: [
        {
          id: 'noah-dishes',
          title: 'Kitchen reset',
          note: 'Last pan dried and shelved.',
          completed: true,
        },
        {
          id: 'noah-garbage',
          title: 'Garage bins',
          note: 'Roll out before sunset.',
          completed: true,
        },
        {
          id: 'noah-dog',
          title: 'Evening dog walk',
          note: 'Short loop is enough in the rain.',
          completed: true,
        },
      ],
    },
  ],
});

export function getScaffoldBoardSnapshot(householdName: string): BoardSnapshot {
  return {
    ...scaffoldBoardSeed,
    householdName,
  };
}
