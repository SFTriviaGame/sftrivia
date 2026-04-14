import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { artists, songs, puzzles, puzzleSongs } from "./schema";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ARTISTS: { name: string; songs: string[] }[] = [
  {
    name: "Nas",
    songs: [
      "Memory Lane (Sittin' in da Park)", "Represent", "One Time 4 Your Mind",
      "The World Is Yours", "N.Y. State of Mind", "Life's a Bitch",
      "One Mic", "Made You Look", "Hate Me Now",
      "It Ain't Hard to Tell", "Street Dreams", "If I Ruled the World (Imagine That)",
    ],
  },
  {
    name: "Wu-Tang Clan",
    songs: [
      "Can It Be All So Simple", "Tearz", "Clan in da Front",
      "Da Mystery of Chessboxin'", "Method Man", "Bring da Ruckus",
      "Reunited", "Triumph", "Gravel Pit",
      "Protect Ya Neck", "Wu-Tang Clan Ain't Nuthing ta F' Wit",
      "C.R.E.A.M.",
    ],
  },
  {
    name: "A Tribe Called Quest",
    songs: [
      "Excursions", "Butter", "Verses from the Abstract",
      "Electric Relaxation", "Award Tour", "Scenario",
      "Check the Rhime", "Bonita Applebum",
      "We the People....", "Can I Kick It?",
    ],
  },
  {
    name: "Outkast",
    songs: [
      "Aquemini", "Return of the 'G'", "Spottieottiedopaliscious",
      "Elevators (Me & You)", "ATLiens", "Rosa Parks",
      "So Fresh, So Clean", "The Way You Move",
      "Ms. Jackson", "Roses", "B.O.B.", "Hey Ya!",
    ],
  },
  {
    name: "The Notorious B.I.G.",
    songs: [
      "Everyday Struggle", "Machine Gun Funk", "Unbelievable",
      "Warning", "Suicidal Thoughts", "Ten Crack Commandments",
      "Kick in the Door", "Going Back to Cali",
      "Big Poppa", "Hypnotize", "Mo Money Mo Problems",
      "Juicy",
    ],
  },
  {
    name: "Jay-Z",
    songs: [
      "Dead Presidents II", "D'Evils", "Regrets",
      "Can I Live", "Song Cry", "Heart of the City (Ain't No Love)",
      "Izzo (H.O.V.A.)", "Dirt Off Your Shoulder",
      "99 Problems", "Run This Town", "Empire State of Mind",
      "Hard Knock Life (Ghetto Anthem)",
    ],
  },
  {
    name: "Tupac",
    songs: [
      "So Many Tears", "Temptations", "Me Against the World",
      "Brenda's Got a Baby", "Keep Ya Head Up", "I Ain't Mad at Cha",
      "Dear Mama", "All Eyez on Me", "Hit 'Em Up",
      "How Do U Want It", "Changes", "California Love",
    ],
  },
  {
    name: "Eminem",
    songs: [
      "Rock Bottom", "If I Had", "Criminal",
      "The Way I Am", "Kill You", "Cleanin' Out My Closet",
      "Mockingbird", "When I'm Gone", "Rap God",
      "Without Me", "Stan", "Lose Yourself",
      "The Real Slim Shady",
    ],
  },
  {
    name: "Kanye West",
    songs: [
      "Spaceship", "Family Business", "We Don't Care",
      "Gone", "Diamonds from Sierra Leone", "Touch the Sky",
      "Flashing Lights", "Love Lockdown", "Heartless",
      "Runaway", "All of the Lights", "Power",
      "Stronger", "Gold Digger",
    ],
  },
  {
    name: "Lauryn Hill",
    songs: [
      "To Zion", "Ex-Factor", "Final Hour",
      "Lost Ones", "Superstar", "Every Ghetto, Every City",
      "Everything Is Everything", "Doo Wop (That Thing)",
      "Killing Me Softly",
    ],
  },
  {
    name: "Snoop Dogg",
    songs: [
      "Murder Was the Case", "Lodi Dodi", "Tha Shiznit",
      "Who Am I (What's My Name)?", "Serial Killa",
      "Beautiful", "Signs", "Young, Wild & Free",
      "Nuthin' but a 'G' Thang", "Still D.R.E.",
      "Drop It Like It's Hot", "Gin and Juice",
    ],
  },
  {
    name: "Ice Cube",
    songs: [
      "A Bird in the Hand", "Dead Homiez", "The Nigga Ya Love to Hate",
      "Wicked", "No Vaseline", "Steady Mobbin'",
      "Check Yo Self", "You Can Do It",
      "Today Was a Good Day", "It Was a Good Day",
    ],
  },
  {
    name: "Public Enemy",
    songs: [
      "Rebel Without a Pause", "Black Steel in the Hour of Chaos",
      "Don't Believe the Hype", "Welcome to the Terrordome",
      "Night of the Living Baseheads", "Bring the Noise",
      "911 Is a Joke", "Fight the Power",
    ],
  },
  {
    name: "Run-DMC",
    songs: [
      "Sucker M.C.'s", "Rock Box", "King of Rock",
      "Peter Piper", "My Adidas", "Tricky",
      "Down with the King", "It's Like That",
      "It's Tricky", "Walk This Way",
    ],
  },
  {
    name: "Missy Elliott",
    songs: [
      "Sock It 2 Me", "Beep Me 911", "She's a Bitch",
      "One Minute Man", "Gossip Folks", "Pass That Dutch",
      "Lose Control", "WTF (Where They From)",
      "Work It", "Get Ur Freak On",
    ],
  },
  {
    name: "Lil Wayne",
    songs: [
      "Tha Block Is Hot", "Go DJ", "Fireman",
      "Hustler Musik", "Shooter", "Got Money",
      "Mrs. Officer", "Right Above It",
      "6 Foot 7 Foot", "How to Love",
      "A Milli", "Lollipop",
    ],
  },
  {
    name: "50 Cent",
    songs: [
      "Many Men (Wish Death)", "Patiently Waiting", "Heat",
      "If I Can't", "Wanksta", "Window Shopper",
      "Ayo Technology", "Candy Shop",
      "21 Questions", "P.I.M.P.", "In Da Club",
    ],
  },
  {
    name: "DMX",
    songs: [
      "Slippin'", "Damien", "How's It Goin' Down",
      "Get at Me Dog", "Ruff Ryders' Anthem", "What's My Name?",
      "Party Up (Up in Here)", "X Gon' Give It to Ya",
    ],
  },
  {
    name: "Busta Rhymes",
    songs: [
      "Scenario", "Woo Hah!! Got You All in Check",
      "Put Your Hands Where My Eyes Could See",
      "Dangerous", "Fire It Up", "Pass the Courvoisier, Part II",
      "I Know What You Want", "Touch It",
      "Break Ya Neck", "Look at Me Now",
    ],
  },
  {
    name: "Mobb Deep",
    songs: [
      "Temperature's Rising", "Right Back at You",
      "Eye for an Eye (Your Beef Is Mines)", "Trife Life",
      "Survival of the Fittest", "Quiet Storm",
      "Burn", "Got It Twisted",
      "Shook Ones, Pt. II",
    ],
  },
  {
    name: "Nicki Minaj",
    songs: [
      "Itty Bitty Piggy", "Did It On'em", "Beez in the Trap",
      "Moment 4 Life", "Fly", "Pound the Alarm",
      "Anaconda", "Bang Bang", "Chun-Li",
      "Starships", "Super Bass",
    ],
  },
  {
    name: "Rakim",
    songs: [
      "My Melody", "I Know You Got Soul", "Follow the Leader",
      "Microphone Fiend", "Paid in Full", "Don't Sweat the Technique",
      "Juice (Know the Ledge)", "Guess Who's Back",
    ],
  },
  {
    name: "Scarface",
    songs: [
      "A Minute to Pray and a Second to Die", "I Seen a Man Die",
      "Mind Playing Tricks on Me", "No Tears", "On My Block",
      "Guess Who's Back", "My Homies", "Smile",
    ],
  },
  {
    name: "Tyler, the Creator",
    songs: [
      "Yonkers", "She", "Tamale",
      "IFHY", "Deathcamp", "Who Dat Boy",
      "911 / Mr. Lonely", "See You Again",
      "EARFQUAKE", "NEW MAGIC WAND",
    ],
  },
  {
    name: "Megan Thee Stallion",
    songs: [
      "Big Ole Freak", "Cash Shit", "Captain Hook",
      "Girls in the Hood", "Cry Baby", "Thot Shit",
      "Body", "WAP", "Hot Girl Summer",
      "Savage",
    ],
  },
];

async function seedHipHop() {
  console.log(`Seeding ${ARTISTS.length} hip-hop artists...`);

  for (const artist of ARTISTS) {
    const nameNormalized = normalize(artist.name);

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
        .values({ name: artist.name, nameNormalized } as any)
        .returning({ id: artists.id });
      artistId = newArtist.id;
      console.log(`  + Created artist: ${artist.name}`);
    }

    const existingPuzzle = await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.artistId, artistId))
      .then((rows: any[]) => rows[0]);

    let puzzleId: string;

    if (existingPuzzle) {
      puzzleId = existingPuzzle.id;
      const currentTags: string[] = existingPuzzle.tags || [];
      if (!currentTags.includes("hip-hop")) {
        await db
          .update(puzzles)
          .set({ tags: [...currentTags, "hip-hop"] } as any)
          .where(eq(puzzles.id, puzzleId));
        console.log(`    ↳ Added "hip-hop" tag to existing puzzle`);
      }
      console.log(`  ✓ Puzzle exists, skipping songs`);
      continue;
    } else {
      const [newPuzzle] = await db
        .insert(puzzles)
        .values({
          mode: "artist",
          primaryGenre: "hip-hop",
          tags: ["hip-hop"],
          published: true,
          artistId,
        } as any)
        .returning({ id: puzzles.id });
      puzzleId = newPuzzle.id;
      console.log(`    + Created puzzle`);
    }

    for (let i = 0; i < artist.songs.length; i++) {
      const [newSong] = await db
        .insert(songs)
        .values({ name: artist.songs[i], artistId } as any)
        .returning({ id: songs.id });
      await db.insert(puzzleSongs).values({
        puzzleId, songId: newSong.id, displayOrder: i + 1,
      } as any);
    }
    console.log(`    + Added ${artist.songs.length} songs`);
  }

  console.log("\nDone! Hip-hop seed complete.");
}

seedHipHop().catch(console.error);
