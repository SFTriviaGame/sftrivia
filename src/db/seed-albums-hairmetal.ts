import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { artists, albums, songs, puzzles, puzzleSongs } from "./schema";
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

// ── Album Data ──────────────────────────────────────────────────────────────
// Songs ordered: index 0 = deepest cut (displayOrder 1), last = biggest hit

interface AlbumEntry {
  artist: string;
  album: string;
  year: number;
  songs: string[];
}

const ALBUMS: AlbumEntry[] = [
  {
    artist: "Mötley Crüe",
    album: "Shout at the Devil",
    year: 1983,
    songs: [
      "God Bless the Children of the Beast", "Danger",
      "Red Hot", "Knock 'Em Dead, Kid",
      "Ten Seconds to Love", "Bastard",
      "Helter Skelter", "Too Young to Fall in Love",
      "Looks That Kill", "Shout at the Devil",
    ],
  },
  {
    artist: "Mötley Crüe",
    album: "Theatre of Pain",
    year: 1985,
    songs: [
      "Save Our Souls", "Raise Your Hands to Rock",
      "Fight for Your Rights", "Use It or Lose It",
      "Keep Your Eye on the Money", "City Boy Blues",
      "Tonight (We Need a Lover)", "Louder Than Hell",
      "Smokin' in the Boys Room", "Home Sweet Home",
    ],
  },
  {
    artist: "Mötley Crüe",
    album: "Girls, Girls, Girls",
    year: 1987,
    songs: [
      "Sumthin' for Nuthin'", "Dancing on Glass",
      "Bad Boy Boogie", "Nona",
      "Five Years Dead", "All in the Name Of...",
      "You're All I Need", "Jailhouse Rock",
      "Wild Side", "Girls, Girls, Girls",
    ],
  },
  {
    artist: "Mötley Crüe",
    album: "Dr. Feelgood",
    year: 1989,
    songs: [
      "T.n.T. (Terror 'n Tinseltown)", "Slice of Your Pie",
      "She Goes Down", "Sticky Sweet",
      "Rattlesnake Shake", "Same Ol' Situation (S.O.S.)",
      "Don't Go Away Mad (Just Go Away)", "Without You",
      "Kickstart My Heart", "Dr. Feelgood",
    ],
  },
  {
    artist: "Def Leppard",
    album: "Pyromania",
    year: 1983,
    songs: [
      "Die Hard the Hunter", "Billy's Got a Gun",
      "Comin' Under Fire", "Action! Not Words",
      "Stagefright", "Too Late for Love",
      "Foolin'", "Rock of Ages",
      "Rock! Rock! (Till You Drop)", "Photograph",
    ],
  },
  {
    artist: "Def Leppard",
    album: "Hysteria",
    year: 1987,
    songs: [
      "Run Riot", "Excitable", "Gods of War",
      "Don't Shoot Shotgun", "Love and Affection",
      "Women", "Rocket", "Love Bites",
      "Armageddon It", "Hysteria",
      "Animal", "Pour Some Sugar on Me",
    ],
  },
  {
    artist: "Poison",
    album: "Look What the Cat Dragged In",
    year: 1986,
    songs: [
      "Play Dirty", "Let Me Go to the Show",
      "#1 Bad Boy", "Blame It on You",
      "Want Some, Need Some", "Cry Tough",
      "Look What the Cat Dragged In",
      "I Won't Forget You", "I Want Action",
      "Talk Dirty to Me",
    ],
  },
  {
    artist: "Poison",
    album: "Open Up and Say... Ahh!",
    year: 1988,
    songs: [
      "Love on the Rocks", "Bad to Be Good",
      "Tearin' Down the Walls", "Look But You Can't Touch",
      "Good Love", "Back to the Rocking Horse",
      "Your Mama Don't Dance", "Fallen Angel",
      "Nothin' but a Good Time", "Every Rose Has Its Thorn",
    ],
  },
  {
    artist: "Ratt",
    album: "Out of the Cellar",
    year: 1984,
    songs: [
      "Scene of the Crime", "I'm Insane",
      "In Your Direction", "She Wants Money",
      "The Morning After", "You're in Love",
      "Lack of Communication", "Back for More",
      "Wanted Man", "Round and Round",
    ],
  },
  {
    artist: "Ratt",
    album: "Invasion of Your Privacy",
    year: 1985,
    songs: [
      "Dangerous but Worth the Risk", "Between the Eyes",
      "What You Give Is What You Get", "Got Me on the Line",
      "You Should Know by Now", "Never Use Love",
      "Give It All", "Closer to My Heart",
      "You're in Trouble", "Lay It Down",
    ],
  },
  {
    artist: "Twisted Sister",
    album: "Stay Hungry",
    year: 1984,
    songs: [
      "Horror-Teria (The Beginning)", "Street Justice",
      "S.M.F.", "Don't Let Me Down",
      "The Price", "Burn in Hell",
      "The Beast", "I Wanna Rock",
      "We're Not Gonna Take It",
    ],
  },
  {
    artist: "Quiet Riot",
    album: "Metal Health",
    year: 1983,
    songs: [
      "Battle Axe", "Don't Wanna Let You Go",
      "Thunderbird", "Let's Get Crazy",
      "Run for Cover", "Slick Black Cadillac",
      "Love's a Bitch", "Breathless",
      "Cum On Feel the Noize",
      "Metal Health (Bang Your Head)",
    ],
  },
  {
    artist: "Warrant",
    album: "Dirty Rotten Filthy Stinking Rich",
    year: 1989,
    songs: [
      "D.R.F.S.R.", "Ridin' High",
      "So Damn Pretty (Should Be Against the Law)",
      "Cold Sweat", "Big Talk",
      "Sometimes She Cries", "32 Pennies",
      "Down Boys", "Heaven",
    ],
  },
  {
    artist: "Warrant",
    album: "Cherry Pie",
    year: 1990,
    songs: [
      "Love in Stereo", "Bed of Roses",
      "Sure Feels Good to Me", "Song and Dance Man",
      "You're the Only Hell Your Mama Ever Raised",
      "Blind Faith", "Mr. Rainmaker",
      "I Saw Red", "Uncle Tom's Cabin",
      "Cherry Pie",
    ],
  },
  {
    artist: "Cinderella",
    album: "Night Songs",
    year: 1986,
    songs: [
      "In from the Outside", "Nothin' for Nothin'",
      "Once Around the Ride", "Hell on Wheels",
      "Push Push", "Back Home Again",
      "Night Songs", "Somebody Save Me",
      "Nobody's Fool", "Shake Me",
    ],
  },
  {
    artist: "Cinderella",
    album: "Long Cold Winter",
    year: 1988,
    songs: [
      "Fire and Ice", "If You Don't Like It",
      "Last Mile", "Second Wind",
      "Long Cold Winter", "Bad Seamstress Blues",
      "Take Me Back", "The Last Mile",
      "Coming Home", "Gypsy Road",
      "Don't Know What You Got (Till It's Gone)",
    ],
  },
  {
    artist: "Dokken",
    album: "Tooth and Nail",
    year: 1984,
    songs: [
      "Turn on the Action", "Just Got Lucky",
      "Heartless Heart", "Don't Close Your Eyes",
      "When Heaven Comes Down", "Into the Fire",
      "Bullets to Spare", "Alone Again",
      "In My Dreams", "Tooth and Nail",
    ],
  },
  {
    artist: "Dokken",
    album: "Under Lock and Key",
    year: 1985,
    songs: [
      "Lightning Strikes Again", "Will the Sun Rise",
      "Slippin' Away", "The Hunter",
      "Till the Livin' End", "Jaded Heart",
      "Don't Lie to Me", "Unchain the Night",
      "It's Not Love", "In My Dreams",
    ],
  },
  {
    artist: "Dokken",
    album: "Back for the Attack",
    year: 1987,
    songs: [
      "Night by Night", "Burning Like a Flame",
      "Lost Behind the Wall", "Stop Fighting Love",
      "Heaven Sent", "Mr. Scary",
      "So Many Tears", "Prisoner",
      "Standing in the Shadows", "Kiss of Death",
      "Dream Warriors",
    ],
  },
  {
    artist: "Skid Row",
    album: "Skid Row",
    year: 1989,
    songs: [
      "Rattlesnake Shake", "Makin' a Mess",
      "Can't Stand the Heartache", "Piece of Me",
      "Sweet Little Sister", "Big Guns",
      "Here I Am", "Midnight/Tornado",
      "I Remember You", "Youth Gone Wild",
      "18 and Life",
    ],
  },
  {
    artist: "Skid Row",
    album: "Slave to the Grind",
    year: 1991,
    songs: [
      "Livin' on a Chain Gang", "Creepshow",
      "Riot Act", "Mudkicker",
      "Get the Fuck Out", "The Threat",
      "Psycho Love", "Beggar's Day",
      "In a Darkened Room", "Quicksand Jesus",
      "Wasted Time", "Slave to the Grind",
    ],
  },
  {
    artist: "Bon Jovi",
    album: "Slippery When Wet",
    year: 1986,
    songs: [
      "Social Disease", "Raise Your Hands",
      "Without Love", "I'd Die for You",
      "Wild in the Streets", "Never Say Goodbye",
      "Let It Rock", "Wanted Dead or Alive",
      "You Give Love a Bad Name", "Livin' on a Prayer",
    ],
  },
  {
    artist: "Bon Jovi",
    album: "New Jersey",
    year: 1988,
    songs: [
      "Love for Sale", "Homebound Train",
      "Wild Is the Wind", "Ride Cowboy Ride",
      "99 in the Shade", "Stick to Your Guns",
      "Blood on Blood", "Born to Be My Baby",
      "Lay Your Hands on Me", "I'll Be There for You",
      "Living in Sin", "Bad Medicine",
    ],
  },
  {
    artist: "Whitesnake",
    album: "Whitesnake",
    year: 1987,
    songs: [
      "Bad Boys", "Children of the Night",
      "Straight for the Heart", "Don't Turn Away",
      "Looking for Love", "Crying in the Rain",
      "Give Me All Your Love",
      "Is This Love", "Still of the Night",
      "Here I Go Again",
    ],
  },
  {
    artist: "Winger",
    album: "Winger",
    year: 1988,
    songs: [
      "State of Emergency", "Time to Surrender",
      "Purple Haze", "Hungry",
      "Without the Night", "Hangin' On",
      "Madalaine", "Headed for a Heartbreak",
      "Seventeen",
    ],
  },
  {
    artist: "Great White",
    album: "...Twice Shy",
    year: 1989,
    songs: [
      "Move It", "Heart the Hunter",
      "Hiway Nights", "The Angel Song",
      "Mista Bone", "Baby's on Fire",
      "House of Broken Love", "She Only",
      "Save Your Love", "Rock Me",
      "Once Bitten, Twice Shy",
    ],
  },
  {
    artist: "Tesla",
    album: "Mechanical Resonance",
    year: 1986,
    songs: [
      "EZ Come EZ Go", "Cumin' Atcha Live",
      "Rock Me to the Top", "We're No Good Together",
      "Gettin' Better", "Before My Eyes",
      "Cover Queen", "Changes",
      "Little Suzi", "Modern Day Cowboy",
    ],
  },
  {
    artist: "Tesla",
    album: "The Great Radio Controversy",
    year: 1989,
    songs: [
      "Lazy Days, Crazy Nights", "The Way It Is",
      "Be a Man", "Yesterdaze Gone",
      "Makin' Magic", "Did It My Way",
      "Party's Over", "Flight to Nowhere",
      "Heaven's Trail (No Way Out)", "Hang Tough",
      "Love Song", "Signs",
    ],
  },
  {
    artist: "Firehouse",
    album: "Firehouse",
    year: 1990,
    songs: [
      "Helpless", "Home Is Where the Heart Is",
      "Rock on the Radio", "Overnight Sensation",
      "All She Wrote", "Shake & Tumble",
      "Oughta Be a Law", "Reach for the Sky",
      "Don't Walk Away", "Don't Treat Me Bad",
      "Love of a Lifetime",
    ],
  },
  {
    artist: "White Lion",
    album: "Pride",
    year: 1987,
    songs: [
      "All Join Our Hands", "Sweet Little Loving",
      "Lady of the Valley", "All You Need Is Rock 'n' Roll",
      "Hungry", "Don't Give Up",
      "Tell Me", "Lonely Nights",
      "Wait", "When the Children Cry",
    ],
  },
  {
    artist: "Stryper",
    album: "To Hell with the Devil",
    year: 1986,
    songs: [
      "Abyss", "Rockin' the World",
      "All of Me", "The Way",
      "Holding On", "More Than a Man",
      "Sing-Along Song", "Calling On You",
      "Free", "To Hell with the Devil",
    ],
  },
  {
    artist: "Scorpions",
    album: "Love at First Sting",
    year: 1984,
    songs: [
      "As Soon as the Good Times Roll",
      "Crossfire", "Big City Nights",
      "Bad Boys Running Wild", "Coming Home",
      "The Same Thrill", "I'm Leaving You",
      "Still Loving You", "Rock You Like a Hurricane",
    ],
  },
  {
    artist: "W.A.S.P.",
    album: "W.A.S.P.",
    year: 1984,
    songs: [
      "B.A.D.", "Show No Mercy",
      "Hellion", "On Your Knees",
      "Tormentor", "School Daze",
      "Sleeping (In the Fire)", "The Flame",
      "L.O.V.E. Machine", "I Wanna Be Somebody",
    ],
  },
  {
    artist: "Extreme",
    album: "Pornograffitti",
    year: 1990,
    songs: [
      "Li'l Jack Horny", "When I'm President",
      "Suzi (Wants Her All Day What?)", "He-Man Woman Hater",
      "Song for Love", "Money (In God We Trust)",
      "It's a Monster", "When I First Kissed You",
      "Hole Hearted", "Get the Funk Out",
      "Decadence Dance", "More Than Words",
    ],
  },
  {
    artist: "Slaughter",
    album: "Stick It to Ya",
    year: 1990,
    songs: [
      "Eye to Eye", "Thinking of June",
      "She Wants More", "That's Not Enough",
      "Burning Bridges", "Loaded Gun",
      "Wild Life", "Mad About You",
      "Spend My Life", "Up All Night",
      "Fly to the Angels",
    ],
  },
  {
    artist: "Faster Pussycat",
    album: "Faster Pussycat",
    year: 1987,
    songs: [
      "Smash Alley", "Ship Rolls In",
      "No Room for Emotion", "Cathouse",
      "Shooting You Down", "City Has No Heart",
      "Bottle in Front of Me", "Babylon",
      "Bathroom Wall", "Don't Change That Song",
    ],
  },
  {
    artist: "Guns N' Roses",
    album: "Appetite for Destruction",
    year: 1987,
    songs: [
      "Anything Goes", "You're Crazy",
      "Think About You", "Out ta Get Me",
      "My Michelle", "Rocket Queen",
      "Nightrain", "Mr. Brownstone",
      "It's So Easy", "Welcome to the Jungle",
      "Paradise City", "Sweet Child O' Mine",
    ],
  },
  {
    artist: "Kix",
    album: "Blow My Fuse",
    year: 1988,
    songs: [
      "Red Lite, Green Lite, TNT", "She Dropped Me the Bomb",
      "No Ring Around Rosie", "Boomerang",
      "Blow My Fuse", "Piece of the Pie",
      "Dirty Boys", "Get It While It's Hot",
      "Cold Shower", "Don't Close Your Eyes",
    ],
  },
  {
    artist: "Lita Ford",
    album: "Lita",
    year: 1988,
    songs: [
      "Under the Gun", "Blueberry",
      "Falling in and Out of Love", "Fatal Passion",
      "Can't Catch Me", "Broken Dreams",
      "Back to the Cave", "Close My Eyes Forever",
      "Kiss Me Deadly",
    ],
  },
  {
    artist: "Night Ranger",
    album: "Midnight Madness",
    year: 1983,
    songs: [
      "Touch of Madness", "Rumour in the Air",
      "Why Does Love Have to Change", "Let Him Run",
      "Chippin' Away", "(You Can Still) Rock in America",
      "When You Close Your Eyes",
      "Sister Christian",
    ],
  },
  {
    artist: "Europe",
    album: "The Final Countdown",
    year: 1986,
    songs: [
      "Love Chaser", "On the Loose",
      "Heart of Stone", "Time Has Come",
      "Danger on the Track", "Cherokee",
      "Ninja", "Carrie", "Rock the Night",
      "The Final Countdown",
    ],
  },
  {
    artist: "Britny Fox",
    album: "Britny Fox",
    year: 1988,
    songs: [
      "Save the Weak", "Fun in Texas",
      "Kick 'n' Fight", "In Motion",
      "Gudbuy T'Jane", "Don't Hide",
      "Long Way to Love", "Hold On",
      "Girlschool",
    ],
  },
  {
    artist: "Enuff Z'Nuff",
    album: "Enuff Z'Nuff",
    year: 1989,
    songs: [
      "I Could Never Be Without You", "Kiss the Clown",
      "In the Groove", "Fingers on It",
      "She Wants More", "For Now",
      "Baby Loves You", "Fly High Michelle",
      "New Thing",
    ],
  },
  {
    artist: "Danger Danger",
    album: "Danger Danger",
    year: 1989,
    songs: [
      "One Step from Paradise", "Under the Gun",
      "Turn It On", "Beat the Bullet",
      "Rock America", "Don't Blame It on Love",
      "Boys Will Be Boys", "Feels Like Love",
      "Naughty Naughty", "Bang Bang",
    ],
  },
  {
    artist: "Hanoi Rocks",
    album: "Two Steps from the Move",
    year: 1984,
    songs: [
      "I Can't Get It", "Boiler",
      "Futuristic Cheetah", "Cutting Corners",
      "High School", "Boulevard of Broken Dreams",
      "Underwater World", "Don't You Ever Leave Me",
      "Up Around the Bend",
    ],
  },
  {
    artist: "L.A. Guns",
    album: "L.A. Guns",
    year: 1988,
    songs: [
      "No Mercy", "Nothing to Lose",
      "Bitch Is Back", "I Found You",
      "Electric Gypsy", "Down in the City",
      "Cry of the Gun", "One Way Ticket",
      "Sex Action", "One More Reason",
    ],
  },
  {
    artist: "Nelson",
    album: "After the Rain",
    year: 1990,
    songs: [
      "Fill You Up", "Bits and Pieces",
      "Will You Love Me", "I Can Hardly Wait",
      "Only Time Will Tell", "After the Rain",
      "More Than Ever", "(Can't Live Without Your) Love and Affection",
    ],
  },
  {
    artist: "Jackyl",
    album: "Jackyl",
    year: 1992,
    songs: [
      "Dirty Little Mind", "Just Like a Negro",
      "She Loves My Cock", "Mental Masturbation",
      "Headed for Destruction", "Back Off Brother",
      "I Stand Alone", "Down on Me",
      "When Will It Rain", "The Lumberjack",
    ],
  },
  {
    artist: "Bulletboys",
    album: "Bulletboys",
    year: 1988,
    songs: [
      "Kissin' Kitty", "Badlands",
      "Hell Yeah!", "Shoot the Preacher Down",
      "Hard as a Rock", "Owed to Joe",
      "Smooth Up in Ya", "F#9",
      "For the Love of Money",
    ],
  },
  {
    artist: "Bang Tango",
    album: "Psycho Cafe",
    year: 1989,
    songs: [
      "Do What You're Told", "Wrap My Wings",
      "Breaking Up a Heart of Stone", "Midnight Struck",
      "Love Injection", "Attack of Life",
      "Untied and True", "Someone Like You",
    ],
  },
];

// ── Seed function ───────────────────────────────────────────────────────────

async function seedAlbums() {
  console.log(`Seeding ${ALBUMS.length} hair metal albums...\n`);

  for (const entry of ALBUMS) {
    const artistNormalized = normalize(entry.artist);
    const albumNormalized = normalize(entry.album);

    // ── Find or create artist ─────────────────────────────────────────
    const existingArtist = await db
      .select()
      .from(artists)
      .where(eq(artists.nameNormalized, artistNormalized))
      .then((rows: any[]) => rows[0]);

    let artistId: string;

    if (existingArtist) {
      artistId = existingArtist.id;
      console.log(`  ✓ Artist exists: ${entry.artist}`);
    } else {
      const [newArtist] = await db
        .insert(artists)
        .values({
          name: entry.artist,
          nameNormalized: artistNormalized,
        } as any)
        .returning({ id: artists.id });
      artistId = newArtist.id;
      console.log(`  + Created artist: ${entry.artist}`);
    }

    // ── Check if album already exists ─────────────────────────────────
    const existingAlbum = await db
      .select()
      .from(albums)
      .where(eq(albums.nameNormalized, albumNormalized))
      .then((rows: any[]) => rows.find((r: any) => r.artistId === artistId));

    if (existingAlbum) {
      console.log(`  ✓ Album exists: ${entry.album} — skipping`);
      continue;
    }

    // ── Create album ──────────────────────────────────────────────────
    const [newAlbum] = await db
      .insert(albums)
      .values({
        name: entry.album,
        nameNormalized: albumNormalized,
        artistId,
        year: entry.year,
      } as any)
      .returning({ id: albums.id });

    const albumId = newAlbum.id;
    console.log(`    + Created album: ${entry.album} (${entry.year})`);

    // ── Create puzzle (album mode) ────────────────────────────────────
    const [newPuzzle] = await db
      .insert(puzzles)
      .values({
        mode: "album",
        primaryGenre: "hair-metal",
        tags: ["hair-metal", "80s"],
        published: true,
        albumId,
      } as any)
      .returning({ id: puzzles.id });

    const puzzleId = newPuzzle.id;
    console.log(`    + Created album puzzle`);

    // ── Insert songs and link to puzzle ────────────────────────────────
    for (let i = 0; i < entry.songs.length; i++) {
      const songName = entry.songs[i];

      const [newSong] = await db
        .insert(songs)
        .values({
          name: songName,
          artistId,
          albumId,
        } as any)
        .returning({ id: songs.id });

      await db.insert(puzzleSongs).values({
        puzzleId,
        songId: newSong.id,
        displayOrder: i + 1,
      } as any);
    }

    console.log(`    + Added ${entry.songs.length} songs\n`);
  }

  console.log("Done! Album seed complete.");
}

seedAlbums().catch(console.error);
