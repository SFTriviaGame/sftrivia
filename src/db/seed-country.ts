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
    name: "Johnny Cash",
    songs: [
      "Big River", "Get Rhythm", "Cry! Cry! Cry!",
      "I Walk the Line", "Folsom Prison Blues", "Jackson",
      "Sunday Mornin' Comin' Down", "A Boy Named Sue",
      "Man in Black", "Hurt", "Ring of Fire",
    ],
  },
  {
    name: "Dolly Parton",
    songs: [
      "Coat of Many Colors", "Two Doors Down", "Here You Come Again",
      "Islands in the Stream", "Why'd You Come in Here Lookin' Like That",
      "9 to 5", "I Will Always Love You", "Jolene",
    ],
  },
  {
    name: "Willie Nelson",
    songs: [
      "Whiskey River", "Funny How Time Slips Away", "Night Life",
      "Blue Eyes Crying in the Rain", "Good Hearted Woman",
      "Mammas Don't Let Your Babies Grow Up to Be Cowboys",
      "Always on My Mind", "On the Road Again",
    ],
  },
  {
    name: "Garth Brooks",
    songs: [
      "The Dance", "The River", "The Thunder Rolls",
      "Shameless", "Ain't Goin' Down ('Til the Sun Comes Up)",
      "Callin' Baton Rouge", "Standing Outside the Fire",
      "That Summer", "Papa Loved Mama",
      "Friends in Low Places",
    ],
  },
  {
    name: "George Strait",
    songs: [
      "Fool Hearted Memory", "Does Fort Worth Ever Cross Your Mind",
      "The Chair", "Nobody in His Right Mind Would've Left Her",
      "Ocean Front Property", "All My Ex's Live in Texas",
      "Check Yes or No", "Carrying Your Love with Me",
      "I Cross My Heart", "Amarillo by Morning",
    ],
  },
  {
    name: "Hank Williams",
    songs: [
      "I'm So Lonesome I Could Cry", "Move It on Over",
      "Settin' the Woods on Fire", "Long Gone Lonesome Blues",
      "Honky Tonkin'", "Lovesick Blues", "Cold, Cold Heart",
      "Jambalaya (On the Bayou)", "Hey, Good Lookin'",
      "Your Cheatin' Heart",
    ],
  },
  {
    name: "Merle Haggard",
    songs: [
      "Workin' Man Blues", "The Bottle Let Me Down",
      "Sing Me Back Home", "Tonight the Bottle Let Me Down",
      "If We Make It Through December", "Mama Tried",
      "I Think I'll Just Stay Here and Drink",
      "Okie from Muskogee",
    ],
  },
  {
    name: "Patsy Cline",
    songs: [
      "Walkin' After Midnight", "I Fall to Pieces",
      "She's Got You", "Leavin' On Your Mind",
      "Sweet Dreams (Of You)", "Back in Baby's Arms",
      "Faded Love", "Crazy",
    ],
  },
  {
    name: "Alan Jackson",
    songs: [
      "Here in the Real World", "Dallas", "Someday",
      "Midnight in Montgomery", "Don't Rock the Jukebox",
      "Gone Country", "Where Were You (When the World Stopped Turning)",
      "Drive (For Daddy Gene)", "It's Five O'Clock Somewhere",
      "Chattahoochee",
    ],
  },
  {
    name: "Tim McGraw",
    songs: [
      "Don't Take the Girl", "I Like It, I Love It",
      "It's Your Love", "Just to See You Smile",
      "Something Like That", "Live Like You Were Dying",
      "My Best Friend", "Real Good Man",
      "Humble and Kind", "Highway Don't Care",
    ],
  },
  {
    name: "Shania Twain",
    songs: [
      "Whose Bed Have Your Boots Been Under?", "Any Man of Mine",
      "No One Needs to Know", "Love Gets Me Every Time",
      "Don't Be Stupid (You Know I Love You)", "From This Moment On",
      "You're Still the One", "That Don't Impress Me Much",
      "Man! I Feel Like a Woman!", "You're Still the One",
    ],
  },
  {
    name: "Kenny Rogers",
    songs: [
      "Ruby, Don't Take Your Love to Town", "She Believes in Me",
      "You Decorated My Life", "Love or Something Like It",
      "Lady", "Through the Years", "Coward of the County",
      "Islands in the Stream", "Lucille", "The Gambler",
    ],
  },
  {
    name: "George Jones",
    songs: [
      "White Lightning", "The Race Is On", "Walk Through This World with Me",
      "A Good Year for the Roses", "The Grand Tour",
      "Golden Ring", "Bartender's Blues",
      "Who's Gonna Fill Their Shoes", "He Stopped Loving Her Today",
    ],
  },
  {
    name: "Waylon Jennings",
    songs: [
      "Only Daddy That'll Walk the Line", "Cedartown, Georgia",
      "Are You Sure Hank Done It This Way", "I've Always Been Crazy",
      "Amanda", "Luckenbach, Texas (Back to the Basics of Love)",
      "Good Hearted Woman", "Theme from The Dukes of Hazzard",
    ],
  },
  {
    name: "Loretta Lynn",
    songs: [
      "Don't Come Home A-Drinkin' (With Lovin' on Your Mind)",
      "Fist City", "You Ain't Woman Enough",
      "Rated 'X'", "One's on the Way", "The Pill",
      "You're Lookin' at Country", "Coal Miner's Daughter",
    ],
  },
  {
    name: "Blake Shelton",
    songs: [
      "Austin", "Ol' Red", "The Baby",
      "Some Beach", "Home", "Honey Bee",
      "Sure Be Cool If You Did", "Mine Would Be You",
      "Boys 'Round Here", "Sangria",
      "God Gave Me You", "Hillbilly Bone",
    ],
  },
  {
    name: "Luke Bryan",
    songs: [
      "All My Friends Say", "Do I", "Rain Is a Good Thing",
      "Someone Else Calling You Baby", "I Don't Want This Night to End",
      "Drunk on You", "That's My Kind of Night",
      "Play It Again", "Kick the Dust Up",
      "Huntin', Fishin' and Lovin' Every Day",
      "Country Girl (Shake It for Me)",
    ],
  },
  {
    name: "Carrie Underwood",
    songs: [
      "Jesus, Take the Wheel", "Don't Forget to Remember Me",
      "Wasted", "So Small", "Last Name",
      "Cowboy Casanova", "Blown Away",
      "Something in the Water", "Church Bells",
      "Cry Pretty", "Before He Cheats",
    ],
  },
  {
    name: "Keith Urban",
    songs: [
      "Somebody Like You", "Days Go By", "You'll Think of Me",
      "Making Memories of Us", "Better Life",
      "Sweet Thing", "Kiss a Girl", "Without You",
      "Blue Ain't Your Color", "The Fighter",
    ],
  },
  {
    name: "Toby Keith",
    songs: [
      "Should've Been a Cowboy", "A Little Less Talk and a Lot More Action",
      "Who's That Man", "Me Too", "How Do You Like Me Now?!",
      "You Shouldn't Kiss Me Like This",
      "I Love This Bar", "Beer for My Horses",
      "As Good as I Once Was",
      "Red Solo Cup", "Courtesy of the Red, White and Blue",
    ],
  },
  {
    name: "Zac Brown Band",
    songs: [
      "Where the Boat Leaves From", "Whatever It Is", "Toes",
      "Highway 20 Ride", "Free", "Colder Weather",
      "Knee Deep", "Keep Me in Mind", "Homegrown",
      "Beautiful Drug", "Chicken Fried",
    ],
  },
  {
    name: "Chris Stapleton",
    songs: [
      "What Are You Listening To", "Outlaw State of Mind",
      "Parachute", "Either Way", "Broken Halos",
      "Millionaire", "Starting Over", "Joy of My Life",
      "Whiskey and You", "Fire Away",
      "Tennessee Whiskey",
    ],
  },
  {
    name: "Miranda Lambert",
    songs: [
      "Kerosene", "Gunpowder & Lead", "White Liar",
      "The House That Built Me", "Heart Like Mine",
      "Baggage Claim", "Mama's Broken Heart",
      "Automatic", "Tin Man", "Bluebird",
      "Vice",
    ],
  },
  {
    name: "Jason Aldean",
    songs: [
      "Hicktown", "Why", "Johnny Cash",
      "She's Country", "Big Green Tractor",
      "The Truth", "Fly Over States",
      "Night Train", "When She Says Baby",
      "Burnin' It Down", "Dirt Road Anthem",
    ],
  },
  {
    name: "Morgan Wallen",
    songs: [
      "Up Down", "Whiskey Glasses", "Chasin' You",
      "More Than My Hometown", "7 Summers",
      "Sand in My Boots", "Wasted on You",
      "You Proof", "Thought You Should Know",
      "Last Night",
    ],
  },
];

async function seedCountry() {
  console.log(`Seeding ${ARTISTS.length} country artists...`);

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
      if (!currentTags.includes("country")) {
        await db
          .update(puzzles)
          .set({ tags: [...currentTags, "country"] } as any)
          .where(eq(puzzles.id, puzzleId));
        console.log(`    ↳ Added "country" tag to existing puzzle`);
      }
      console.log(`  ✓ Puzzle exists, skipping songs`);
      continue;
    } else {
      const [newPuzzle] = await db
        .insert(puzzles)
        .values({
          mode: "artist",
          primaryGenre: "country",
          tags: ["country"],
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

  console.log("\nDone! Country seed complete.");
}

seedCountry().catch(console.error);
