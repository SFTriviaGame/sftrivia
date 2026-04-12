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

// ── 60s Artist Data ─────────────────────────────────────────────────────────
// Songs ordered: index 0 = deepest cut (displayOrder 1), last = biggest hit

const ARTISTS_60S: { name: string; songs: string[] }[] = [
  {
    name: "The Beatles",
    songs: [
      "Rain", "I'm Only Sleeping", "Norwegian Wood",
      "Dear Prudence", "While My Guitar Gently Weeps",
      "Strawberry Fields Forever", "Blackbird",
      "Eleanor Rigby", "Come Together", "Something",
      "Here Comes the Sun", "Yesterday",
      "Let It Be", "Hey Jude",
    ],
  },
  {
    name: "The Rolling Stones",
    songs: [
      "Under My Thumb", "Play with Fire", "19th Nervous Breakdown",
      "Ruby Tuesday", "She's a Rainbow", "Jumpin' Jack Flash",
      "Wild Horses", "You Can't Always Get What You Want",
      "Sympathy for the Devil", "Gimme Shelter",
      "Paint It Black", "(I Can't Get No) Satisfaction",
    ],
  },
  {
    name: "Bob Dylan",
    songs: [
      "It Ain't Me Babe", "Subterranean Homesick Blues",
      "Desolation Row", "Just Like a Woman",
      "A Hard Rain's a-Gonna Fall", "I Want You",
      "Rainy Day Women #12 & 35", "Mr. Tambourine Man",
      "Knockin' on Heaven's Door", "The Times They Are a-Changin'",
      "Like a Rolling Stone", "Blowin' in the Wind",
    ],
  },
  {
    name: "Jimi Hendrix",
    songs: [
      "Little Wing", "The Wind Cries Mary", "Bold as Love",
      "Castles Made of Sand", "Crosstown Traffic",
      "Foxy Lady", "Voodoo Child (Slight Return)",
      "All Along the Watchtower", "Hey Joe",
      "Purple Haze",
    ],
  },
  {
    name: "The Beach Boys",
    songs: [
      "In My Room", "Don't Worry Baby", "Sloop John B",
      "Wouldn't It Be Nice", "Caroline, No",
      "God Only Knows", "I Get Around",
      "Help Me, Rhonda", "Kokomo",
      "California Girls", "Good Vibrations",
      "Surfin' U.S.A.",
    ],
  },
  {
    name: "The Doors",
    songs: [
      "The Crystal Ship", "People Are Strange", "Soul Kitchen",
      "Love Her Madly", "Roadhouse Blues",
      "The End", "Riders on the Storm",
      "Touch Me", "Break On Through (To the Other Side)",
      "Hello, I Love You", "Light My Fire",
    ],
  },
  {
    name: "Aretha Franklin",
    songs: [
      "Do Right Woman, Do Right Man", "Baby I Love You",
      "You Make Me Feel Like a Natural Woman",
      "Chain of Fools", "I Say a Little Prayer",
      "Think", "Rock Steady", "Spanish Harlem",
      "A Rose Is Still a Rose", "(You Make Me Feel Like) A Natural Woman",
      "R-E-S-P-E-C-T",
    ],
  },
  {
    name: "The Who",
    songs: [
      "The Kids Are Alright", "I Can See for Miles",
      "Substitute", "Bargain", "The Seeker",
      "Pinball Wizard", "Won't Get Fooled Again",
      "Behind Blue Eyes", "Who Are You",
      "My Generation", "Baba O'Riley",
    ],
  },
  {
    name: "The Kinks",
    songs: [
      "Waterloo Sunset", "Dead End Street", "Tired of Waiting for You",
      "A Well Respected Man", "Dedicated Follower of Fashion",
      "Sunny Afternoon", "All Day and All of the Night",
      "Come Dancing", "Lola",
      "You Really Got Me",
    ],
  },
  {
    name: "Cream",
    songs: [
      "I Feel Free", "Strange Brew", "Tales of Brave Ulysses",
      "Badge", "Politician", "Born Under a Bad Sign",
      "Crossroads", "White Room",
      "Sunshine of Your Love",
    ],
  },
  {
    name: "Otis Redding",
    songs: [
      "Mr. Pitiful", "I've Been Loving You Too Long",
      "Respect", "These Arms of Mine", "Pain in My Heart",
      "Fa-Fa-Fa-Fa-Fa (Sad Song)", "Try a Little Tenderness",
      "Hard to Handle", "My Girl",
      "(Sittin' On) The Dock of the Bay",
    ],
  },
  {
    name: "Janis Joplin",
    songs: [
      "Summertime", "Ball and Chain", "Down on Me",
      "Kozmic Blues", "Try (Just a Little Bit Harder)",
      "Cry Baby", "Mercedes Benz",
      "Bobby McGee", "Piece of My Heart",
      "Me and Bobby McGee",
    ],
  },
  {
    name: "Simon & Garfunkel",
    songs: [
      "A Hazy Shade of Winter", "I Am a Rock", "Homeward Bound",
      "Scarborough Fair", "America", "Bookends",
      "Cecilia", "The Boxer", "Mrs. Robinson",
      "The Sound of Silence", "Bridge Over Troubled Water",
    ],
  },
  {
    name: "The Supremes",
    songs: [
      "Nothing but Heartaches", "My World Is Empty Without You",
      "I Hear a Symphony", "Love Child",
      "Reflections", "You Keep Me Hangin' On",
      "Where Did Our Love Go", "Come See About Me",
      "Baby Love", "Stop! In the Name of Love",
      "You Can't Hurry Love",
    ],
  },
  {
    name: "Marvin Gaye",
    songs: [
      "Ain't That Peculiar", "Pride and Joy",
      "How Sweet It Is (To Be Loved by You)", "Too Busy Thinking About My Baby",
      "Mercy Mercy Me (The Ecology)", "Inner City Blues",
      "What's Going On", "Sexual Healing",
      "I Heard It Through the Grapevine",
      "Let's Get It On",
    ],
  },
  {
    name: "The Temptations",
    songs: [
      "Get Ready", "Ain't Too Proud to Beg",
      "I Wish It Would Rain", "I Can't Get Next to You",
      "Ball of Confusion", "Just My Imagination",
      "Papa Was a Rollin' Stone",
      "The Way You Do the Things You Do",
      "I'm Gonna Make You Love Me",
      "My Girl",
    ],
  },
  {
    name: "Creedence Clearwater Revival",
    songs: [
      "Lodi", "Green River", "Commotion",
      "Down on the Corner", "Travelin' Band",
      "Up Around the Bend", "Who'll Stop the Rain",
      "Have You Ever Seen the Rain", "Fortunate Son",
      "Bad Moon Rising", "Proud Mary",
    ],
  },
  {
    name: "The Animals",
    songs: [
      "Boom Boom", "Baby Let Me Take You Home",
      "I'm Crying", "Don't Let Me Be Misunderstood",
      "Bring It On Home to Me", "We Gotta Get Out of This Place",
      "It's My Life", "Don't Bring Me Down",
      "The House of the Rising Sun",
    ],
  },
  {
    name: "Sam Cooke",
    songs: [
      "Nothing Can Change This Love", "Bring It On Home to Me",
      "Having a Party", "Good Times",
      "Another Saturday Night", "Wonderful World",
      "Cupid", "Twistin' the Night Away",
      "Chain Gang", "A Change Is Gonna Come",
      "You Send Me",
    ],
  },
  {
    name: "Roy Orbison",
    songs: [
      "In Dreams", "Blue Bayou", "Running Scared",
      "It's Over", "Blue Angel", "Dream Baby",
      "You Got It", "Only the Lonely",
      "Crying", "Pretty Woman",
    ],
  },
  {
    name: "The Byrds",
    songs: [
      "I'll Feel a Whole Lot Better", "Eight Miles High",
      "So You Want to Be a Rock 'n' Roll Star",
      "My Back Pages", "All I Really Want to Do",
      "Chestnut Mare", "Wasn't Born to Follow",
      "Turn! Turn! Turn!",
      "Mr. Tambourine Man",
    ],
  },
  {
    name: "Dusty Springfield",
    songs: [
      "Wishin' and Hopin'", "All I See Is You",
      "The Look of Love", "I Just Don't Know What to Do with Myself",
      "I Only Want to Be with You", "Spooky",
      "Windmills of Your Mind", "You Don't Have to Say You Love Me",
      "Son of a Preacher Man",
    ],
  },
  {
    name: "The Mamas & the Papas",
    songs: [
      "Creeque Alley", "Words of Love", "Go Where You Wanna Go",
      "Dedicated to the One I Love", "I Saw Her Again",
      "Monday, Monday", "Dream a Little Dream of Me",
      "California Dreamin'",
    ],
  },
  {
    name: "Buffalo Springfield",
    songs: [
      "Go and Say Goodbye", "Nowadays Clancy Can't Even Sing",
      "Burned", "Sit Down I Think I Love You",
      "Bluebird", "Rock & Roll Woman",
      "Kind Woman", "Mr. Soul",
      "For What It's Worth",
    ],
  },
  {
    name: "The Four Tops",
    songs: [
      "Ask the Lonely", "Something About You",
      "Shake Me, Wake Me (When It's Over)",
      "Standing in the Shadows of Love", "Bernadette",
      "Baby I Need Your Loving", "It's the Same Old Song",
      "Reach Out I'll Be There",
      "I Can't Help Myself (Sugar Pie Honey Bunch)",
    ],
  },
];

// ── Seed function ───────────────────────────────────────────────────────────

async function seed60s() {
  console.log(`Seeding ${ARTISTS_60S.length} 60s artists...`);

  for (const artist of ARTISTS_60S) {
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
      // Update tags to include "60s" if not already present
      const currentTags: string[] = existingPuzzle.tags || [];
      if (!currentTags.includes("60s")) {
        await db
          .update(puzzles)
          .set({ tags: [...currentTags, "60s"] } as any)
          .where(eq(puzzles.id, puzzleId));
        console.log(`    ↳ Added "60s" tag to existing puzzle`);
      }
      console.log(`  ✓ Puzzle exists, skipping songs`);
      continue;
    } else {
      const [newPuzzle] = await db
        .insert(puzzles)
        .values({
          mode: "artist",
          primaryGenre: "60s",
          tags: ["60s"],
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

  console.log("\nDone! 60s seed complete.");
}

seed60s().catch(console.error);
