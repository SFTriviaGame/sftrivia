import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { artists, songs, puzzles, puzzleSongs } from "./schema";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── 2000s Artist Data ───────────────────────────────────────────────────────
// Songs ordered: index 0 = deepest cut (displayOrder 1), last = biggest hit

const ARTISTS_2000S: { name: string; songs: string[] }[] = [
  {
    name: "Linkin Park",
    songs: [
      "Forgotten", "Runaway", "With You", "A Place for My Head",
      "Pushing Me Away", "Papercut", "Faint", "From the Inside",
      "One Step Closer", "Breaking the Habit", "What I've Done",
      "Crawling", "Numb", "In the End",
    ],
  },
  {
    name: "Green Day",
    songs: [
      "Letterbomb", "Homecoming", "She's a Rebel", "Extraordinary Girl",
      "Geek Stink Breath", "Waiting", "Jesus of Suburbia",
      "Brain Stew", "Wake Me Up When September Ends", "21 Guns",
      "Holiday", "Basket Case", "American Idiot", "Boulevard of Broken Dreams",
    ],
  },
  {
    name: "The Killers",
    songs: [
      "Bones", "Uncle Jonny", "Sam's Town", "For Reasons Unknown",
      "Jenny Was a Friend of Mine", "Smile Like You Mean It",
      "A Dustland Fairytale", "All These Things That I've Done",
      "Read My Mind", "Somebody Told Me", "When You Were Young",
      "Human", "Mr. Brightside",
    ],
  },
  {
    name: "Coldplay",
    songs: [
      "Amsterdam", "A Rush of Blood to the Head", "Shiver",
      "God Put a Smile upon Your Face", "Trouble", "Talk",
      "Speed of Sound", "In My Place", "Fix You", "The Scientist",
      "Yellow", "Viva la Vida", "Clocks",
    ],
  },
  {
    name: "My Chemical Romance",
    songs: [
      "The Sharpest Lives", "House of Wolves", "Vampires Will Never Hurt You",
      "Cemetery Drive", "You Know What They Do to Guys Like Us in Prison",
      "Thank You for the Venom", "Na Na Na", "Sing",
      "Famous Last Words", "Teenagers", "The Black Parade",
      "I'm Not Okay (I Promise)", "Helena", "Welcome to the Black Parade",
    ],
  },
  {
    name: "Fall Out Boy",
    songs: [
      "Get Busy Living or Get Busy Dying", "Nobody Puts Baby in the Corner",
      "Our Lawyer Made Us Change the Name of This Song",
      "Sophomore Slump or Comeback of the Year", "A Little Less Sixteen Candles",
      "Grand Theft Autumn", "The Take Over, the Breaks Over",
      "I Don't Care", "Dance, Dance",
      "Thnks fr th Mmrs", "Sugar, We're Goin Down",
    ],
  },
  {
    name: "System of a Down",
    songs: [
      "Deer Dance", "Needles", "Psycho", "Violent Pornography",
      "Radio/Video", "Cigaro", "Question!", "Lonely Day",
      "Hypnotize", "Aerials", "B.Y.O.B.",
      "Sugar", "Toxicity", "Chop Suey!",
    ],
  },
  {
    name: "Foo Fighters",
    songs: [
      "Generator", "Stacked Actors", "Low", "DOA",
      "No Way Back", "Resolve", "Long Road to Ruin",
      "The Pretender", "All My Life", "Times Like These",
      "My Hero", "Best of You", "Learn to Fly", "Everlong",
    ],
  },
  {
    name: "Muse",
    songs: [
      "Citizen Erased", "Map of the Problematique", "Assassin",
      "The Handler", "Hysteria", "Plug In Baby",
      "New Born", "Butterflies and Hurricanes", "Resistance",
      "Madness", "Time Is Running Out", "Uprising",
      "Supermassive Black Hole", "Knights of Cydonia", "Starlight",
    ],
  },
  {
    name: "Arctic Monkeys",
    songs: [
      "A Certain Romance", "From the Ritz to the Rubble",
      "Dancing Shoes", "Still Take You Home", "Mardy Bum",
      "Teddy Picker", "Brianstorm", "Crying Lightning",
      "Cornerstone", "Fluorescent Adolescent", "505",
      "Do I Wanna Know?", "R U Mine?", "I Bet You Look Good on the Dancefloor",
    ],
  },
  {
    name: "Kings of Leon",
    songs: [
      "Trani", "Soft Through the Night", "Molly's Chambers",
      "Joe's Head", "The Bucket", "Four Kicks",
      "Knocked Up", "On Call", "Closer",
      "Revelry", "Notion",
      "Use Somebody", "Sex on Fire",
    ],
  },
  {
    name: "The White Stripes",
    songs: [
      "The Big Three Killed My Baby", "Dead Leaves and the Dirty Ground",
      "I'm Finding It Harder to Be a Gentleman", "Hotel Yorba",
      "The Hardest Button to Button", "Ball and Biscuit",
      "I Just Don't Know What to Do with Myself", "Blue Orchid",
      "My Doorbell", "The Denial Twist", "Icky Thump",
      "Fell in Love with a Girl", "Seven Nation Army",
    ],
  },
  {
    name: "Gorillaz",
    songs: [
      "Sound Check (Gravity)", "Tomorrow Comes Today", "5/4",
      "Re-Hash", "Latin Simone", "Rock the House",
      "El Manana", "Dirty Harry", "Kids with Guns",
      "On Melancholy Hill", "Dare", "19-2000",
      "Clint Eastwood", "Feel Good Inc.",
    ],
  },
  {
    name: "Evanescence",
    songs: [
      "Tourniquet", "Everybody's Fool", "Whisper",
      "Haunted", "Imaginary", "Hello",
      "Weight of the World", "Lithium", "Call Me When You're Sober",
      "Going Under", "My Immortal", "Bring Me to Life",
    ],
  },
  {
    name: "Paramore",
    songs: [
      "Emergency", "All We Know", "Let the Flames Begin",
      "Born for This", "Fences", "Crushcrushcrush",
      "The Only Exception", "Brick by Boring Brick",
      "Ignorance", "Ain't It Fun", "Still Into You",
      "Misery Business", "Decode",
    ],
  },
  {
    name: "Nickelback",
    songs: [
      "Flat on the Floor", "Animals", "Follow You Home",
      "Side of a Bullet", "If Everyone Cared", "Savin' Me",
      "Far Away", "Someday", "Gotta Be Somebody",
      "Photograph", "Rockstar", "How You Remind Me",
    ],
  },
  {
    name: "Three Days Grace",
    songs: [
      "Burn", "Just Like You", "Home", "Overrated",
      "Wake Up", "Pain", "Riot", "Break",
      "The Good Life", "World So Cold",
      "Animal I Have Become", "Never Too Late", "I Hate Everything About You",
    ],
  },
  {
    name: "Maroon 5",
    songs: [
      "The Sun", "Must Get Out", "Tangled",
      "Not Coming Home", "Secret", "Wake Up Call",
      "Makes Me Wonder", "Won't Go Home Without You",
      "If I Never See Your Face Again", "Sunday Morning",
      "Maps", "She Will Be Loved", "This Love",
    ],
  },
  {
    name: "OutKast",
    songs: [
      "Aquemini", "Bombs Over Baghdad", "Da Art of Storytellin'",
      "GhettoMusick", "Prototype", "The Way You Move",
      "So Fresh, So Clean", "The Whole World",
      "Roses", "Ms. Jackson", "Hey Ya!",
    ],
  },
  {
    name: "Eminem",
    songs: [
      "Criminal", "Kill You", "The Way I Am",
      "Role Model", "White America", "Cleanin' Out My Closet",
      "Superman", "Mockingbird", "When I'm Gone",
      "My Name Is", "Without Me", "The Real Slim Shady",
      "Stan", "Lose Yourself",
    ],
  },
  {
    name: "Kanye West",
    songs: [
      "Spaceship", "All Falls Down", "Family Business",
      "Drive Slow", "Gone", "Heard 'Em Say",
      "Diamonds from Sierra Leone", "Touch the Sky", "Flashing Lights",
      "Love Lockdown", "Homecoming", "Heartless",
      "Stronger", "Gold Digger", "Jesus Walks",
    ],
  },
  {
    name: "Rihanna",
    songs: [
      "Let Me", "Break It Off", "Unfaithful",
      "Shut Up and Drive", "Rehab", "Take a Bow",
      "Disturbia", "Don't Stop the Music", "Only Girl (In the World)",
      "Rude Boy", "SOS", "We Found Love",
      "Diamonds", "Umbrella",
    ],
  },
  {
    name: "Beyoncé",
    songs: [
      "Signs", "Me, Myself and I", "Naughty Girl",
      "Check on It", "Ring the Alarm", "Green Light",
      "Sweet Dreams", "If I Were a Boy", "Deja Vu",
      "Irreplaceable", "Halo", "Single Ladies (Put a Ring on It)",
      "Crazy in Love",
    ],
  },
  {
    name: "Amy Winehouse",
    songs: [
      "October Song", "Take the Box", "In My Bed",
      "Stronger Than Me", "Tears Dry on Their Own",
      "Love Is a Losing Game", "Wake Up Alone",
      "You Know I'm No Good", "Valerie", "Back to Black", "Rehab",
    ],
  },
  {
    name: "50 Cent",
    songs: [
      "Many Men", "What Up Gangsta", "High All the Time",
      "If I Can't", "Patiently Waiting", "Wanksta",
      "Disco Inferno", "Just a Lil Bit", "Candy Shop",
      "P.I.M.P.", "21 Questions", "In Da Club",
    ],
  },
  {
    name: "Jack Johnson",
    songs: [
      "Inaudible Melodies", "Flake", "Bubble Toes",
      "Rodeo Clowns", "Taylor", "Breakdown",
      "No Other Way", "Do You Remember", "If I Had Eyes",
      "Sitting, Waiting, Wishing", "Banana Pancakes",
      "Better Together", "Upside Down",
    ],
  },
  {
    name: "Kelly Clarkson",
    songs: [
      "Low", "Miss Independent", "The Trouble with Love Is",
      "Breakaway", "Walk Away", "Gone",
      "Never Again", "Already Gone", "My Life Would Suck Without You",
      "Stronger (What Doesn't Kill You)", "Behind These Hazel Eyes",
      "Because of You", "Since U Been Gone",
    ],
  },
];

// ── Seed function ───────────────────────────────────────────────────────────

async function seed2000s() {
  console.log(`Seeding ${ARTISTS_2000S.length} 2000s artists...`);

  for (const artist of ARTISTS_2000S) {
    const nameNormalized = normalize(artist.name);

    // Check if artist already exists
    const existing = await db
      .select()
      .from(artists)
      .where(eq(artists.nameNormalized, nameNormalized))
      .then((rows: any[]) => rows[0]);

    let artistId: string;

    if (existing) {
      artistId = existing.id;
      console.log(`  ✓ Artist exists: ${artist.name}`);
    } else {
      const [newArtist] = await db
        .insert(artists)
        .values({
          name: artist.name,
          nameNormalized,
        } as any)
        .returning({ id: artists.id });
      artistId = newArtist.id;
      console.log(`  + Created artist: ${artist.name}`);
    }

    // Check if puzzle exists for this artist
    const existingPuzzle = await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.artistId, artistId))
      .then((rows: any[]) => rows[0]);

    let puzzleId: string;

    if (existingPuzzle) {
      puzzleId = existingPuzzle.id;
      // Update tags to include "2000s" if not already present
      const currentTags: string[] = existingPuzzle.tags || [];
      if (!currentTags.includes("2000s")) {
        await db
          .update(puzzles)
          .set({ tags: [...currentTags, "2000s"] } as any)
          .where(eq(puzzles.id, puzzleId));
        console.log(`    ↳ Added "2000s" tag to existing puzzle`);
      }
      console.log(`  ✓ Puzzle exists, skipping songs`);
      continue;
    } else {
      const [newPuzzle] = await db
        .insert(puzzles)
        .values({
          mode: "artist",
          primaryGenre: "2000s",
          tags: ["2000s"],
          published: true,
          artistId,
        } as any)
        .returning({ id: puzzles.id });
      puzzleId = newPuzzle.id;
      console.log(`    + Created puzzle`);
    }

    // Insert songs and link to puzzle
    for (let i = 0; i < artist.songs.length; i++) {
      const songName = artist.songs[i];

      const [newSong] = await db
        .insert(songs)
        .values({
          name: songName,
          artistId,
        } as any)
        .returning({ id: songs.id });

      await db.insert(puzzleSongs).values({
        puzzleId,
        songId: newSong.id,
        displayOrder: i + 1,
      } as any);
    }

    console.log(`    + Added ${artist.songs.length} songs`);
  }

  console.log("\nDone! 2000s seed complete.");
}

seed2000s().catch(console.error);
