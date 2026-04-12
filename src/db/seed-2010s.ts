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

// ── 2010s Artist Data ───────────────────────────────────────────────────────
// Songs ordered: index 0 = deepest cut (displayOrder 1), last = biggest hit

const ARTISTS_2010S: { name: string; songs: string[] }[] = [
  {
    name: "Adele",
    songs: [
      "I'll Be Waiting", "Turning Tables", "One and Only",
      "Remedy", "Water Under the Bridge", "Chasing Pavements",
      "Set Fire to the Rain", "Send My Love (To Your New Lover)",
      "Rumour Has It", "When We Were Young", "Hello",
      "Someone Like You", "Rolling in the Deep",
    ],
  },
  {
    name: "Taylor Swift",
    songs: [
      "Begin Again", "Red", "State of Grace",
      "Style", "Wildest Dreams", "Out of the Woods",
      "Look What You Made Me Do", "Delicate",
      "ME!", "You Need to Calm Down", "Love Story",
      "We Are Never Ever Getting Back Together",
      "Blank Space", "Shake It Off",
    ],
  },
  {
    name: "Ed Sheeran",
    songs: [
      "Give Me Love", "Lego House", "Drunk",
      "Photograph", "Bloodstream", "Don't",
      "Castle on the Hill", "Galway Girl", "Happier",
      "Perfect", "Thinking Out Loud",
      "Shape of You",
    ],
  },
  {
    name: "Bruno Mars",
    songs: [
      "Talking to the Moon", "Runaway Baby", "Liquor Store Blues",
      "Treasure", "When I Was Your Man", "Gorilla",
      "That's What I Like", "Versace on the Floor",
      "24K Magic", "The Lazy Song", "Locked Out of Heaven",
      "Just the Way You Are", "Grenade", "Uptown Funk",
    ],
  },
  {
    name: "Kendrick Lamar",
    songs: [
      "Sing About Me, I'm Dying of Thirst", "Money Trees",
      "The Art of Peer Pressure", "Poetic Justice",
      "King Kunta", "Alright", "These Walls",
      "DNA.", "LOYALTY.", "LOVE.",
      "Swimming Pools (Drank)", "Bitch, Don't Kill My Vibe",
      "HUMBLE.",
    ],
  },
  {
    name: "Drake",
    songs: [
      "Over", "The Motto", "Marvins Room",
      "Hold On, We're Going Home", "Started From the Bottom",
      "Energy", "Back to Back", "Know Yourself",
      "Controlla", "Passionfruit", "Nice For What",
      "In My Feelings", "One Dance", "Hotline Bling",
      "God's Plan",
    ],
  },
  {
    name: "The Weeknd",
    songs: [
      "Wicked Games", "House of Balloons", "The Morning",
      "Often", "Acquainted", "Tell Your Friends",
      "Reminder", "Secrets", "Call Out My Name",
      "Earned It", "I Feel It Coming", "The Hills",
      "Starboy", "Can't Feel My Face",
    ],
  },
  {
    name: "Imagine Dragons",
    songs: [
      "Tiptoe", "Bleeding Out", "Amsterdam",
      "I Bet My Life", "Shots", "Gold",
      "Whatever It Takes", "Natural", "Bad Liar",
      "On Top of the World", "Demons", "Thunder",
      "Believer", "Radioactive",
    ],
  },
  {
    name: "Twenty One Pilots",
    songs: [
      "Car Radio", "Ode to Sleep", "Holding on to You",
      "Fairly Local", "Tear in My Heart", "Lane Boy",
      "Heathens", "My Blood", "Chlorine",
      "Jumpsuit", "House of Gold", "Ride",
      "Stressed Out",
    ],
  },
  {
    name: "Post Malone",
    songs: [
      "Go Flex", "Feeling Whitney", "Patient",
      "Candy Paint", "Psycho", "Ball for Me",
      "Goodbyes", "Wow.", "Circles",
      "Better Now", "I Fall Apart",
      "Congratulations", "Sunflower", "rockstar",
    ],
  },
  {
    name: "Sia",
    songs: [
      "Breathe Me", "Clap Your Hands", "Elastic Heart",
      "Big Girls Cry", "Alive", "The Greatest",
      "Fire Meet Gasoline", "Bird Set Free",
      "Unstoppable", "Titanium", "Diamonds",
      "Cheap Thrills", "Chandelier",
    ],
  },
  {
    name: "Sam Smith",
    songs: [
      "Nirvana", "Like I Can", "I'm Not the Only One",
      "Leave Your Lover", "Lay Me Down",
      "Writing's on the Wall", "Too Good at Goodbyes",
      "Pray", "Dancing with a Stranger", "How Do You Sleep?",
      "Latch", "Money on My Mind",
      "Stay with Me",
    ],
  },
  {
    name: "Lana Del Rey",
    songs: [
      "Blue Jeans", "Off to the Races", "Born to Die",
      "Ride", "National Anthem", "Young and Beautiful",
      "West Coast", "Shades of Cool", "Brooklyn Baby",
      "High by the Beach", "Love", "Mariners Apartment Complex",
      "Venice Bitch", "Summertime Sadness", "Video Games",
    ],
  },
  {
    name: "Mumford & Sons",
    songs: [
      "White Blank Page", "Roll Away Your Stone", "Timshel",
      "The Cave", "Dust Bowl Dance", "Lover of the Light",
      "Below My Feet", "Babel", "Believe",
      "Guiding Light", "I Will Wait",
      "Little Lion Man",
    ],
  },
  {
    name: "Florence + the Machine",
    songs: [
      "Howl", "Blinding", "Cosmic Love",
      "Kiss with a Fist", "Rabbit Heart (Raise It Up)",
      "What the Water Gave Me", "Spectrum",
      "Never Let Me Go", "Queen of Peace",
      "Hunger", "Ship to Wreck", "Shake It Out",
      "Dog Days Are Over",
    ],
  },
  {
    name: "Lorde",
    songs: [
      "Ribs", "A World Alone", "400 Lux",
      "Buzzcut Season", "Tennis Court", "Team",
      "Green Light", "Liability", "Perfect Places",
      "Homemade Dynamite", "Royals",
    ],
  },
  {
    name: "J. Cole",
    songs: [
      "Lost Ones", "Power Trip", "Crooked Smile",
      "Apparently", "Wet Dreamz", "Love Yourz",
      "No Role Modelz", "Deja Vu", "Neighbors",
      "ATM", "MIDDLE CHILD", "KOD",
      "Work Out",
    ],
  },
  {
    name: "Ariana Grande",
    songs: [
      "Baby I", "Right There", "The Way",
      "Love Me Harder", "One Last Time", "Dangerous Woman",
      "Into You", "Side to Side", "No Tears Left to Cry",
      "Breathin", "7 Rings", "Break Free",
      "God Is a Woman", "Problem", "Thank U, Next",
    ],
  },
  {
    name: "Khalid",
    songs: [
      "Saved", "Coaster", "Shot Down",
      "Winter", "American Teen", "8TEEN",
      "OTW", "Better", "Saturday Nights",
      "Love Lies", "Talk", "Location",
      "Young Dumb & Broke",
    ],
  },
  {
    name: "Billie Eilish",
    songs: [
      "Bellyache", "Idontwannabeyouanymore", "Watch",
      "Copycat", "Lovely", "You Should See Me in a Crown",
      "When the Party's Over", "Wish You Were Gay",
      "Bury a Friend", "Everything I Wanted",
      "Ocean Eyes", "All the Good Girls Go to Hell",
      "Bad Guy",
    ],
  },
  {
    name: "Halsey",
    songs: [
      "Ghost", "Hurricane", "New Americana",
      "Colors", "Castle", "Now or Never",
      "Bad at Love", "Alone", "Eastside",
      "Graveyard", "Nightmare", "Without Me",
    ],
  },
  {
    name: "Panic! at the Disco",
    songs: [
      "This Is Gospel", "Nicotine", "Girls/Girls/Boys",
      "Emperor's New Clothes", "Victorious", "Don't Threaten Me with a Good Time",
      "Death of a Bachelor", "LA Devotee", "Say Amen (Saturday Night)",
      "Hey Look Ma, I Made It", "High Hopes",
      "I Write Sins Not Tragedies",
    ],
  },
  {
    name: "The Lumineers",
    songs: [
      "Flowers in Your Hair", "Submarines", "Stubborn Love",
      "Dead Sea", "Big Parade", "Cleopatra",
      "Ophelia", "Sleep on the Floor", "Angela",
      "Gloria", "Brightside",
      "Ho Hey",
    ],
  },
  {
    name: "Hozier",
    songs: [
      "Jackie and Wilson", "Work Song", "From Eden",
      "Cherry Wine", "Someone New", "Sedated",
      "Nina Cried Power", "Movement", "Almost (Sweet Music)",
      "Wasteland, Baby!", "Take Me to Church",
    ],
  },
  {
    name: "Childish Gambino",
    songs: [
      "Bonfire", "Heartbeat", "Freaks and Geeks",
      "Sober", "Telegraph Ave", "Sweatpants",
      "3005", "Terrified", "Feels Like Summer",
      "Redbone", "This Is America",
    ],
  },
  {
    name: "Travis Scott",
    songs: [
      "Mamacita", "Oh My Dis Side", "Maria I'm Drunk",
      "3500", "Through the Late Night", "Pick Up the Phone",
      "Butterfly Effect", "Stop Trying to Be God",
      "Stargazing", "Highest in the Room",
      "Antidote", "goosebumps", "SICKO MODE",
    ],
  },
  {
    name: "The Chainsmokers",
    songs: [
      "Bouquet", "Roses", "Let You Go",
      "Don't Let Me Down", "All We Know",
      "Paris", "Something Just Like This",
      "Sick Boy", "Everybody Hates Me",
      "Who Do You Love", "Selfie",
      "Closer",
    ],
  },
];

// ── Seed function ───────────────────────────────────────────────────────────

async function seed2010s() {
  console.log(`Seeding ${ARTISTS_2010S.length} 2010s artists...`);

  for (const artist of ARTISTS_2010S) {
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
      // Update tags to include "2010s" if not already present
      const currentTags: string[] = existingPuzzle.tags || [];
      if (!currentTags.includes("2010s")) {
        await db
          .update(puzzles)
          .set({ tags: [...currentTags, "2010s"] } as any)
          .where(eq(puzzles.id, puzzleId));
        console.log(`    ↳ Added "2010s" tag to existing puzzle`);
      }
      console.log(`  ✓ Puzzle exists, skipping songs`);
      continue;
    } else {
      const [newPuzzle] = await db
        .insert(puzzles)
        .values({
          mode: "artist",
          primaryGenre: "2010s",
          tags: ["2010s"],
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

  console.log("\nDone! 2010s seed complete.");
}

seed2010s().catch(console.error);
