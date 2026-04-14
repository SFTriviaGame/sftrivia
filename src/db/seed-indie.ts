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
    name: "Radiohead",
    songs: [
      "Let Down", "Lucky", "The Tourist",
      "Airbag", "Subterranean Homesick Alien",
      "Exit Music (For a Film)", "No Surprises",
      "Everything in Its Right Place", "Idioteque",
      "Fake Plastic Trees", "Paranoid Android",
      "Karma Police", "Creep",
    ],
  },
  {
    name: "Arctic Monkeys",
    songs: [
      "A Certain Romance", "Mardy Bum", "Dancing Shoes",
      "From the Ritz to the Rubble", "Teddy Picker",
      "Fluorescent Adolescent", "Crying Lightning",
      "Why'd You Only Call Me When You're High?",
      "R U Mine?", "505",
      "I Bet You Look Good on the Dancefloor",
      "Do I Wanna Know?",
    ],
  },
  {
    name: "The Strokes",
    songs: [
      "Alone, Together", "Barely Legal", "Trying Your Luck",
      "Hard to Explain", "Someday", "12:51",
      "Reptilia", "You Only Live Once", "Juicebox",
      "Under Cover of Darkness", "Is This It",
      "Last Nite",
    ],
  },
  {
    name: "Vampire Weekend",
    songs: [
      "Cape Cod Kwassa Kwassa", "Oxford Comma", "Walcott",
      "Giving Up the Gun", "Cousins", "Holiday",
      "Diane Young", "Step", "Unbelievers",
      "Harmony Hall", "Sunflower",
      "A-Punk",
    ],
  },
  {
    name: "Arcade Fire",
    songs: [
      "Neighborhood #1 (Tunnels)", "Rebellion (Lies)", "Crown of Love",
      "Power Out", "No Cars Go", "Intervention",
      "Keep the Car Running", "The Suburbs",
      "Ready to Start", "Sprawl II (Mountains Beyond Mountains)",
      "Reflektor", "Wake Up",
    ],
  },
  {
    name: "Modest Mouse",
    songs: [
      "Dramamine", "Trailer Trash", "Cowboy Dan",
      "3rd Planet", "Gravity Rides Everything",
      "The World at Large", "Ocean Breathes Salty",
      "Dashboard", "Missed the Boat",
      "Lampshades on Fire", "Float On",
    ],
  },
  {
    name: "Death Cab for Cutie",
    songs: [
      "A Movie Script Ending", "The New Year", "Title and Registration",
      "Transatlanticism", "The Sound of Settling",
      "Soul Meets Body", "Crooked Teeth",
      "I Will Follow You into the Dark", "You Are a Tourist",
      "Gold Rush", "I Will Possess Your Heart",
    ],
  },
  {
    name: "Tame Impala",
    songs: [
      "Solitude Is Bliss", "Alter Ego", "Desire Be, Desire Go",
      "Feels Like We Only Go Backwards", "Mind Mischief",
      "Elephant", "Let It Happen",
      "New Person, Same Old Mistakes", "Borderline",
      "Lost in Yesterday", "The Less I Know the Better",
    ],
  },
  {
    name: "The National",
    songs: [
      "About Today", "Secret Meeting", "Abel",
      "Fake Empire", "Apartment Story", "Mistaken for Strangers",
      "Bloodbuzz Ohio", "Terrible Love", "Graceless",
      "I Need My Girl", "Day I Die",
    ],
  },
  {
    name: "Bon Iver",
    songs: [
      "Flume", "Lump Sum", "The Wolves (Act I and II)",
      "Creature Fear", "Perth", "Holocene",
      "Calgary", "Beth/Rest", "8 (circle)",
      "Hey, Ma", "Skinny Love",
    ],
  },
  {
    name: "The Black Keys",
    songs: [
      "Thickfreakness", "Set You Free", "I Got Mine",
      "Tighten Up", "Howlin' for You", "Next Girl",
      "Gold on the Ceiling", "Lonely Boy",
      "Little Black Submarines", "Fever",
      "Weight of Love",
    ],
  },
  {
    name: "Interpol",
    songs: [
      "Untitled", "NYC", "PDA",
      "Say Hello to the Angels", "Stella Was a Diver and She Was Always Down",
      "Obstacle 1", "Slow Hands", "Evil",
      "C'mere", "The Heinrich Maneuver",
      "All the Rage Back Home",
    ],
  },
  {
    name: "Fleet Foxes",
    songs: [
      "Ragged Wood", "Tiger Mountain Peasant Song",
      "Blue Ridge Mountains", "He Doesn't Know Why",
      "Mykonos", "Your Protector", "Helplessness Blues",
      "Montezuma", "Grown Ocean",
      "White Winter Hymnal",
    ],
  },
  {
    name: "The Shins",
    songs: [
      "Know Your Onion!", "One by One All Day",
      "Caring Is Creepy", "Saint Simon",
      "So Says I", "Phantom Limb",
      "Turn on Me", "Simple Song",
      "September", "New Slang",
    ],
  },
  {
    name: "Neutral Milk Hotel",
    songs: [
      "The King of Carrot Flowers, Pt. One", "Holland, 1945",
      "Two-Headed Boy", "Oh Comely",
      "Ghost", "Two-Headed Boy, Pt. Two",
      "Communist Daughter", "In the Aeroplane Over the Sea",
    ],
  },
  {
    name: "LCD Soundsystem",
    songs: [
      "Daft Punk Is Playing at My House", "Tribulations",
      "North American Scum", "All My Friends",
      "Someone Great", "Sound of Silver",
      "Drunk Girls", "Dance Yrself Clean",
      "I Can Change", "Losing My Edge",
    ],
  },
  {
    name: "MGMT",
    songs: [
      "The Youth", "Weekend Wars", "Of Moons, Birds & Monsters",
      "Congratulations", "Flash Delirium",
      "Alien Days", "Little Dark Age",
      "When You Die", "Me and Michael",
      "Electric Feel", "Time to Pretend", "Kids",
    ],
  },
  {
    name: "The Decemberists",
    songs: [
      "July, July!", "The Engine Driver", "The Sporting Life",
      "O Valencia!", "The Crane Wife 3",
      "The Rake's Song", "Down by the Water",
      "Make You Better", "Once in My Life",
      "Here I Dreamt I Was an Architect",
    ],
  },
  {
    name: "Sufjan Stevens",
    songs: [
      "Casimir Pulaski Day", "John Wayne Gacy, Jr.",
      "The Predatory Wasp of the Palisades Is Out to Get Us!",
      "Chicago", "Jacksonville", "Come On! Feel the Illinoise!",
      "No Shade in the Shadow of the Cross",
      "Fourth of July", "Should Have Known Better",
      "Mystery of Love",
    ],
  },
  {
    name: "Phoebe Bridgers",
    songs: [
      "Smoke Signals", "Funeral", "Scott Street",
      "Motion Sickness", "Georgia", "Garden Song",
      "Kyoto", "Chinese Satellite", "Savior Complex",
      "I Know the End", "Moon Song",
    ],
  },
  {
    name: "Beach House",
    songs: [
      "Gila", "Zebra", "Norway",
      "Myth", "Lazuli", "Other People",
      "Sparks", "Lemon Glow", "Dark Spring",
      "Space Song", "Silver Soul",
    ],
  },
  {
    name: "Grizzly Bear",
    songs: [
      "Knife", "On a Neck, on a Spit", "Lullabye",
      "Two Weeks", "While You Wait for the Others",
      "Ready, Able", "Sleeping Ute", "Yet Again",
      "Mourning Sound", "Three Rings",
    ],
  },
  {
    name: "Cage the Elephant",
    songs: [
      "In One Ear", "Back Against the Wall",
      "Aberdeen", "Shake Me Down", "Around My Head",
      "Take It or Leave It", "Come a Little Closer",
      "Cigarette Daydreams", "Trouble",
      "Mess Around", "Ain't No Rest for the Wicked",
    ],
  },
  {
    name: "Mac DeMarco",
    songs: [
      "Cooking Up Something Good", "Ode to Viceroy",
      "Salad Days", "Passing Out Pieces", "Brother",
      "Let My Baby Stay", "Chamber of Reflection",
      "My Old Man", "On the Level",
      "Freaking Out the Neighborhood",
    ],
  },
  {
    name: "The War on Drugs",
    songs: [
      "Baby Missiles", "Brothers", "Best Night",
      "Red Eyes", "Under the Pressure", "An Ocean in Between the Waves",
      "Holding On", "Pain", "Strangest Thing",
      "I Don't Live Here Anymore",
    ],
  },
];

async function seedIndie() {
  console.log(`Seeding ${ARTISTS.length} indie artists...`);

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
      if (!currentTags.includes("indie")) {
        await db
          .update(puzzles)
          .set({ tags: [...currentTags, "indie"] } as any)
          .where(eq(puzzles.id, puzzleId));
        console.log(`    ↳ Added "indie" tag to existing puzzle`);
      }
      console.log(`  ✓ Puzzle exists, skipping songs`);
      continue;
    } else {
      const [newPuzzle] = await db
        .insert(puzzles)
        .values({
          mode: "artist",
          primaryGenre: "indie",
          tags: ["indie"],
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

  console.log("\nDone! Indie seed complete.");
}

seedIndie().catch(console.error);
