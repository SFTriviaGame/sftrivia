import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { artists, albums, songs, puzzles, puzzleSongs } from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

interface ArtistData {
  name: string;
  normalized: string;
  country: string;
  years: string;
  genre: string;
  albums: { name: string; year: number }[];
  songs: { name: string; albumIndex: number; popularity: number }[];
}

const artistData: ArtistData[] = [
  {
    name: "Poison", normalized: "poison", country: "US", years: "1983-present", genre: "hair metal",
    albums: [{ name: "Look What the Cat Dragged In", year: 1986 }, { name: "Open Up and Say... Ahh!", year: 1988 }, { name: "Flesh & Blood", year: 1990 }],
    songs: [
      { name: "Cry Tough", albumIndex: 0, popularity: 10 },
      { name: "I Want Action", albumIndex: 0, popularity: 20 },
      { name: "Look What the Cat Dragged In", albumIndex: 0, popularity: 30 },
      { name: "Fallen Angel", albumIndex: 1, popularity: 38 },
      { name: "Your Mama Don't Dance", albumIndex: 1, popularity: 42 },
      { name: "Unskinny Bop", albumIndex: 2, popularity: 52 },
      { name: "Something to Believe In", albumIndex: 2, popularity: 58 },
      { name: "Nothin' but a Good Time", albumIndex: 1, popularity: 68 },
      { name: "Talk Dirty to Me", albumIndex: 0, popularity: 78 },
      { name: "Every Rose Has Its Thorn", albumIndex: 1, popularity: 95 },
    ],
  },
  {
    name: "Bon Jovi", normalized: "bon jovi", country: "US", years: "1983-present", genre: "hair metal",
    albums: [{ name: "Bon Jovi", year: 1984 }, { name: "Slippery When Wet", year: 1986 }, { name: "New Jersey", year: 1988 }],
    songs: [
      { name: "Runaway", albumIndex: 0, popularity: 15 },
      { name: "In and Out of Love", albumIndex: 0, popularity: 22 },
      { name: "Wild in the Streets", albumIndex: 1, popularity: 30 },
      { name: "Raise Your Hands", albumIndex: 1, popularity: 35 },
      { name: "I'll Be There for You", albumIndex: 2, popularity: 45 },
      { name: "Bad Medicine", albumIndex: 2, popularity: 55 },
      { name: "Wanted Dead or Alive", albumIndex: 1, popularity: 65 },
      { name: "You Give Love a Bad Name", albumIndex: 1, popularity: 80 },
      { name: "Livin' on a Prayer", albumIndex: 1, popularity: 96 },
    ],
  },
  {
    name: "Whitesnake", normalized: "whitesnake", country: "UK", years: "1978-present", genre: "hair metal",
    albums: [{ name: "Slide It In", year: 1984 }, { name: "Whitesnake", year: 1987 }, { name: "Slip of the Tongue", year: 1989 }],
    songs: [
      { name: "Slow an' Easy", albumIndex: 0, popularity: 12 },
      { name: "Slide It In", albumIndex: 0, popularity: 22 },
      { name: "Give Me All Your Love", albumIndex: 1, popularity: 30 },
      { name: "Fool for Your Loving", albumIndex: 2, popularity: 38 },
      { name: "The Deeper the Love", albumIndex: 2, popularity: 42 },
      { name: "Is This Love", albumIndex: 1, popularity: 58 },
      { name: "Still of the Night", albumIndex: 1, popularity: 68 },
      { name: "Here I Go Again", albumIndex: 1, popularity: 95 },
    ],
  },
  {
    name: "Warrant", normalized: "warrant", country: "US", years: "1984-present", genre: "hair metal",
    albums: [{ name: "Dirty Rotten Filthy Stinking Rich", year: 1989 }, { name: "Cherry Pie", year: 1990 }],
    songs: [
      { name: "Big Talk", albumIndex: 0, popularity: 10 },
      { name: "So Damn Pretty (Should Be Against the Law)", albumIndex: 0, popularity: 18 },
      { name: "Sometimes She Cries", albumIndex: 0, popularity: 28 },
      { name: "I Saw Red", albumIndex: 1, popularity: 38 },
      { name: "Uncle Tom's Cabin", albumIndex: 1, popularity: 48 },
      { name: "Down Boys", albumIndex: 0, popularity: 55 },
      { name: "Heaven", albumIndex: 0, popularity: 68 },
      { name: "Cherry Pie", albumIndex: 1, popularity: 95 },
    ],
  },
  {
    name: "Ratt", normalized: "ratt", country: "US", years: "1976-present", genre: "hair metal",
    albums: [{ name: "Out of the Cellar", year: 1984 }, { name: "Invasion of Your Privacy", year: 1985 }, { name: "Dancing Undercover", year: 1986 }],
    songs: [
      { name: "Scene of the Crime", albumIndex: 0, popularity: 10 },
      { name: "Back for More", albumIndex: 0, popularity: 20 },
      { name: "Wanted Man", albumIndex: 0, popularity: 28 },
      { name: "Lay It Down", albumIndex: 1, popularity: 38 },
      { name: "You're in Love", albumIndex: 1, popularity: 45 },
      { name: "Body Talk", albumIndex: 2, popularity: 52 },
      { name: "Lack of Communication", albumIndex: 0, popularity: 60 },
      { name: "Round and Round", albumIndex: 0, popularity: 92 },
    ],
  },
  {
    name: "Cinderella", normalized: "cinderella", country: "US", years: "1983-2017", genre: "hair metal",
    albums: [{ name: "Night Songs", year: 1986 }, { name: "Long Cold Winter", year: 1988 }, { name: "Heartbreak Station", year: 1990 }],
    songs: [
      { name: "Push Push", albumIndex: 0, popularity: 10 },
      { name: "Night Songs", albumIndex: 0, popularity: 20 },
      { name: "Somebody Save Me", albumIndex: 0, popularity: 28 },
      { name: "Coming Home", albumIndex: 1, popularity: 35 },
      { name: "Heartbreak Station", albumIndex: 2, popularity: 42 },
      { name: "Gypsy Road", albumIndex: 1, popularity: 52 },
      { name: "Don't Know What You Got (Till It's Gone)", albumIndex: 1, popularity: 68 },
      { name: "Nobody's Fool", albumIndex: 0, popularity: 75 },
      { name: "Shake Me", albumIndex: 0, popularity: 85 },
    ],
  },
  {
    name: "Skid Row", normalized: "skid row", country: "US", years: "1986-present", genre: "hair metal",
    albums: [{ name: "Skid Row", year: 1989 }, { name: "Slave to the Grind", year: 1991 }],
    songs: [
      { name: "Rattlesnake Shake", albumIndex: 0, popularity: 10 },
      { name: "Makin' a Mess", albumIndex: 0, popularity: 18 },
      { name: "Piece of Me", albumIndex: 0, popularity: 25 },
      { name: "Monkey Business", albumIndex: 1, popularity: 35 },
      { name: "Slave to the Grind", albumIndex: 1, popularity: 42 },
      { name: "I Remember You", albumIndex: 0, popularity: 58 },
      { name: "Youth Gone Wild", albumIndex: 0, popularity: 72 },
      { name: "18 and Life", albumIndex: 0, popularity: 90 },
    ],
  },
  {
    name: "Twisted Sister", normalized: "twisted sister", country: "US", years: "1972-2016", genre: "hair metal",
    albums: [{ name: "You Can't Stop Rock 'n' Roll", year: 1983 }, { name: "Stay Hungry", year: 1984 }, { name: "Come Out and Play", year: 1985 }],
    songs: [
      { name: "The Price", albumIndex: 1, popularity: 12 },
      { name: "Burn in Hell", albumIndex: 1, popularity: 22 },
      { name: "You Can't Stop Rock 'n' Roll", albumIndex: 0, popularity: 30 },
      { name: "The Kids Are Back", albumIndex: 0, popularity: 38 },
      { name: "I Am (I'm Me)", albumIndex: 0, popularity: 42 },
      { name: "Leader of the Pack", albumIndex: 2, popularity: 48 },
      { name: "I Wanna Rock", albumIndex: 1, popularity: 75 },
      { name: "We're Not Gonna Take It", albumIndex: 1, popularity: 95 },
    ],
  },
  {
    name: "Quiet Riot", normalized: "quiet riot", country: "US", years: "1973-present", genre: "hair metal",
    albums: [{ name: "Metal Health", year: 1983 }, { name: "Condition Critical", year: 1984 }],
    songs: [
      { name: "Battle Axe", albumIndex: 0, popularity: 10 },
      { name: "Don't Wanna Let You Go", albumIndex: 0, popularity: 18 },
      { name: "Thunderbird", albumIndex: 0, popularity: 25 },
      { name: "Mama Weer All Crazee Now", albumIndex: 1, popularity: 35 },
      { name: "Party All Night", albumIndex: 1, popularity: 42 },
      { name: "Bang Your Head (Metal Health)", albumIndex: 0, popularity: 65 },
      { name: "Cum On Feel the Noize", albumIndex: 0, popularity: 90 },
    ],
  },
  {
    name: "Dokken", normalized: "dokken", country: "US", years: "1979-present", genre: "hair metal",
    albums: [{ name: "Tooth and Nail", year: 1984 }, { name: "Under Lock and Key", year: 1985 }, { name: "Back for the Attack", year: 1987 }],
    songs: [
      { name: "Just Got Lucky", albumIndex: 0, popularity: 12 },
      { name: "Into the Fire", albumIndex: 0, popularity: 20 },
      { name: "Tooth and Nail", albumIndex: 0, popularity: 28 },
      { name: "The Hunter", albumIndex: 1, popularity: 35 },
      { name: "It's Not Love", albumIndex: 1, popularity: 42 },
      { name: "Dream Warriors", albumIndex: 2, popularity: 52 },
      { name: "Alone Again", albumIndex: 0, popularity: 60 },
      { name: "In My Dreams", albumIndex: 1, popularity: 68 },
      { name: "Breaking the Chains", albumIndex: 0, popularity: 78 },
    ],
  },
  {
    name: "Winger", normalized: "winger", country: "US", years: "1987-present", genre: "hair metal",
    albums: [{ name: "Winger", year: 1988 }, { name: "In the Heart of the Young", year: 1990 }],
    songs: [
      { name: "Time to Surrender", albumIndex: 0, popularity: 10 },
      { name: "Without the Night", albumIndex: 0, popularity: 18 },
      { name: "Can't Get Enuff", albumIndex: 1, popularity: 28 },
      { name: "Easy Come Easy Go", albumIndex: 1, popularity: 35 },
      { name: "Madalaine", albumIndex: 0, popularity: 45 },
      { name: "Headed for a Heartbreak", albumIndex: 0, popularity: 58 },
      { name: "Seventeen", albumIndex: 0, popularity: 78 },
    ],
  },
  {
    name: "Great White", normalized: "great white", country: "US", years: "1977-present", genre: "hair metal",
    albums: [{ name: "Once Bitten", year: 1987 }, { name: "...Twice Shy", year: 1989 }],
    songs: [
      { name: "Lady Red Light", albumIndex: 0, popularity: 12 },
      { name: "Save Your Love", albumIndex: 0, popularity: 22 },
      { name: "Rock Me", albumIndex: 0, popularity: 35 },
      { name: "House of Broken Love", albumIndex: 1, popularity: 45 },
      { name: "The Angel Song", albumIndex: 1, popularity: 52 },
      { name: "Once Bitten, Twice Shy", albumIndex: 1, popularity: 88 },
    ],
  },
  {
    name: "Tesla", normalized: "tesla", country: "US", years: "1981-present", genre: "hair metal",
    albums: [{ name: "Mechanical Resonance", year: 1986 }, { name: "The Great Radio Controversy", year: 1989 }, { name: "Five Man Acoustical Jam", year: 1990 }],
    songs: [
      { name: "Cumin' Atcha Live", albumIndex: 0, popularity: 10 },
      { name: "Gettin' Better", albumIndex: 0, popularity: 18 },
      { name: "Modern Day Cowboy", albumIndex: 0, popularity: 30 },
      { name: "Heaven's Trail (No Way Out)", albumIndex: 1, popularity: 38 },
      { name: "Hang Tough", albumIndex: 1, popularity: 45 },
      { name: "Little Suzi", albumIndex: 0, popularity: 52 },
      { name: "Signs", albumIndex: 2, popularity: 65 },
      { name: "Love Song", albumIndex: 1, popularity: 85 },
    ],
  },
  {
    name: "Firehouse", normalized: "firehouse", country: "US", years: "1989-present", genre: "hair metal",
    albums: [{ name: "Firehouse", year: 1990 }, { name: "Hold Your Fire", year: 1992 }],
    songs: [
      { name: "Shake & Tumble", albumIndex: 0, popularity: 10 },
      { name: "All She Wrote", albumIndex: 0, popularity: 20 },
      { name: "Overnight Sensation", albumIndex: 0, popularity: 30 },
      { name: "When I Look into Your Eyes", albumIndex: 1, popularity: 40 },
      { name: "Don't Walk Away", albumIndex: 0, popularity: 48 },
      { name: "Don't Treat Me Bad", albumIndex: 0, popularity: 62 },
      { name: "Love of a Lifetime", albumIndex: 0, popularity: 85 },
    ],
  },
  {
    name: "Night Ranger", normalized: "night ranger", country: "US", years: "1979-present", genre: "hair metal",
    albums: [{ name: "Dawn Patrol", year: 1982 }, { name: "Midnight Madness", year: 1983 }, { name: "7 Wishes", year: 1985 }],
    songs: [
      { name: "Don't Tell Me You Love Me", albumIndex: 0, popularity: 12 },
      { name: "Sing Me Away", albumIndex: 0, popularity: 20 },
      { name: "When You Close Your Eyes", albumIndex: 1, popularity: 30 },
      { name: "Four in the Morning", albumIndex: 2, popularity: 38 },
      { name: "Sentimental Street", albumIndex: 2, popularity: 45 },
      { name: "(You Can Still) Rock in America", albumIndex: 1, popularity: 58 },
      { name: "Sister Christian", albumIndex: 1, popularity: 92 },
    ],
  },
  {
    name: "Scorpions", normalized: "scorpions", country: "DE", years: "1965-present", genre: "hair metal",
    albums: [{ name: "Love at First Sting", year: 1984 }, { name: "Savage Amusement", year: 1988 }, { name: "Crazy World", year: 1990 }],
    songs: [
      { name: "Bad Boys Running Wild", albumIndex: 0, popularity: 10 },
      { name: "Big City Nights", albumIndex: 0, popularity: 22 },
      { name: "Believe in Love", albumIndex: 1, popularity: 28 },
      { name: "Rhythm of Love", albumIndex: 1, popularity: 35 },
      { name: "Send Me an Angel", albumIndex: 2, popularity: 45 },
      { name: "No One Like You", albumIndex: 0, popularity: 58 },
      { name: "Still Loving You", albumIndex: 0, popularity: 68 },
      { name: "Wind of Change", albumIndex: 2, popularity: 82 },
      { name: "Rock You Like a Hurricane", albumIndex: 0, popularity: 95 },
    ],
  },
  {
    name: "Europe", normalized: "europe", country: "SE", years: "1979-present", genre: "hair metal",
    albums: [{ name: "The Final Countdown", year: 1986 }, { name: "Out of This World", year: 1988 }],
    songs: [
      { name: "Ninja", albumIndex: 0, popularity: 8 },
      { name: "Love Chaser", albumIndex: 0, popularity: 15 },
      { name: "Cherokee", albumIndex: 0, popularity: 22 },
      { name: "Superstitious", albumIndex: 1, popularity: 32 },
      { name: "Rock the Night", albumIndex: 0, popularity: 42 },
      { name: "Carrie", albumIndex: 0, popularity: 58 },
      { name: "The Final Countdown", albumIndex: 0, popularity: 98 },
    ],
  },
  {
    name: "Stryper", normalized: "stryper", country: "US", years: "1983-present", genre: "hair metal",
    albums: [{ name: "Soldiers Under Command", year: 1985 }, { name: "To Hell with the Devil", year: 1986 }, { name: "In God We Trust", year: 1988 }],
    songs: [
      { name: "The Rock That Makes Me Roll", albumIndex: 1, popularity: 10 },
      { name: "Soldiers Under Command", albumIndex: 0, popularity: 18 },
      { name: "Calling on You", albumIndex: 1, popularity: 28 },
      { name: "Honestly", albumIndex: 1, popularity: 40 },
      { name: "Always There for You", albumIndex: 2, popularity: 48 },
      { name: "Free", albumIndex: 1, popularity: 58 },
      { name: "To Hell with the Devil", albumIndex: 1, popularity: 72 },
    ],
  },
  {
    name: "White Lion", normalized: "white lion", country: "US", years: "1983-1991, 2004-2008", genre: "hair metal",
    albums: [{ name: "Pride", year: 1987 }, { name: "Big Game", year: 1989 }],
    songs: [
      { name: "All You Need Is Rock 'n' Roll", albumIndex: 0, popularity: 10 },
      { name: "Lady of the Valley", albumIndex: 0, popularity: 18 },
      { name: "Tell Me", albumIndex: 0, popularity: 28 },
      { name: "Hungry", albumIndex: 0, popularity: 35 },
      { name: "Little Fighter", albumIndex: 1, popularity: 42 },
      { name: "When the Children Cry", albumIndex: 0, popularity: 62 },
      { name: "Wait", albumIndex: 0, popularity: 82 },
    ],
  },
  {
    name: "Lita Ford", normalized: "lita ford", country: "US", years: "1982-present", genre: "hair metal",
    albums: [{ name: "Dancin' on the Edge", year: 1984 }, { name: "Lita", year: 1988 }],
    songs: [
      { name: "Gotta Let Go", albumIndex: 0, popularity: 12 },
      { name: "Fire in My Heart", albumIndex: 0, popularity: 20 },
      { name: "Falling In and Out of Love", albumIndex: 1, popularity: 30 },
      { name: "Back to the Cave", albumIndex: 1, popularity: 38 },
      { name: "Close My Eyes Forever", albumIndex: 1, popularity: 58 },
      { name: "Kiss Me Deadly", albumIndex: 1, popularity: 80 },
    ],
  },
  {
    name: "Faster Pussycat", normalized: "faster pussycat", country: "US", years: "1985-present", genre: "hair metal",
    albums: [{ name: "Faster Pussycat", year: 1987 }, { name: "Wake Me When It's Over", year: 1989 }],
    songs: [
      { name: "Cathouse", albumIndex: 0, popularity: 10 },
      { name: "Bathroom Wall", albumIndex: 0, popularity: 20 },
      { name: "Don't Change That Song", albumIndex: 0, popularity: 28 },
      { name: "Poison Ivy", albumIndex: 1, popularity: 38 },
      { name: "Where There's a Whip There's a Way", albumIndex: 1, popularity: 48 },
      { name: "House of Pain", albumIndex: 1, popularity: 65 },
    ],
  },
  {
    name: "Slaughter", normalized: "slaughter", country: "US", years: "1988-present", genre: "hair metal",
    albums: [{ name: "Stick It to Ya", year: 1990 }, { name: "The Wild Life", year: 1992 }],
    songs: [
      { name: "Eye to Eye", albumIndex: 0, popularity: 10 },
      { name: "Desperately", albumIndex: 0, popularity: 20 },
      { name: "Spend My Life", albumIndex: 0, popularity: 28 },
      { name: "Mad About You", albumIndex: 0, popularity: 38 },
      { name: "Fly to the Angels", albumIndex: 0, popularity: 55 },
      { name: "Up All Night", albumIndex: 0, popularity: 72 },
    ],
  },
  {
    name: "Enuff Z'Nuff", normalized: "enuff znuff", country: "US", years: "1984-present", genre: "hair metal",
    albums: [{ name: "Enuff Z'Nuff", year: 1989 }, { name: "Strength", year: 1991 }],
    songs: [
      { name: "In the Name of Love", albumIndex: 0, popularity: 10 },
      { name: "Fingers on It", albumIndex: 0, popularity: 18 },
      { name: "She Wants More", albumIndex: 0, popularity: 28 },
      { name: "Baby Loves You", albumIndex: 1, popularity: 38 },
      { name: "Mother's Eyes", albumIndex: 1, popularity: 48 },
      { name: "Fly High Michelle", albumIndex: 0, popularity: 62 },
      { name: "New Thing", albumIndex: 0, popularity: 75 },
    ],
  },
  {
    name: "Kix", normalized: "kix", country: "US", years: "1977-present", genre: "hair metal",
    albums: [{ name: "Midnite Dynamite", year: 1985 }, { name: "Blow My Fuse", year: 1988 }],
    songs: [
      { name: "Midnite Dynamite", albumIndex: 0, popularity: 10 },
      { name: "Cold Shower", albumIndex: 0, popularity: 18 },
      { name: "Get It While It's Hot", albumIndex: 1, popularity: 28 },
      { name: "Girl Money", albumIndex: 1, popularity: 35 },
      { name: "Blow My Fuse", albumIndex: 1, popularity: 45 },
      { name: "Cold Blood", albumIndex: 1, popularity: 55 },
      { name: "Don't Close Your Eyes", albumIndex: 1, popularity: 78 },
    ],
  },
  {
    name: "Britny Fox", normalized: "britny fox", country: "US", years: "1985-present", genre: "hair metal",
    albums: [{ name: "Britny Fox", year: 1988 }, { name: "Boys in Heat", year: 1989 }],
    songs: [
      { name: "Fun in Texas", albumIndex: 0, popularity: 8 },
      { name: "Save the Weak", albumIndex: 0, popularity: 15 },
      { name: "Don't Hide", albumIndex: 0, popularity: 22 },
      { name: "Long Way to Love", albumIndex: 0, popularity: 35 },
      { name: "Girlschool", albumIndex: 0, popularity: 52 },
    ],
  },
  {
    name: "Trixter", normalized: "trixter", country: "US", years: "1985-present", genre: "hair metal",
    albums: [{ name: "Trixter", year: 1990 }],
    songs: [
      { name: "Road of a Thousand Dreams", albumIndex: 0, popularity: 10 },
      { name: "Surrender", albumIndex: 0, popularity: 20 },
      { name: "One in a Million", albumIndex: 0, popularity: 35 },
      { name: "Hear!", albumIndex: 0, popularity: 48 },
      { name: "Give It to Me Good", albumIndex: 0, popularity: 65 },
    ],
  },
  {
    name: "Steelheart", normalized: "steelheart", country: "US", years: "1989-present", genre: "hair metal",
    albums: [{ name: "Steelheart", year: 1990 }, { name: "Tangled in Reins", year: 1992 }],
    songs: [
      { name: "Can't Stop Me Lovin' You", albumIndex: 0, popularity: 10 },
      { name: "Like Never Before", albumIndex: 0, popularity: 18 },
      { name: "Rock 'n' Roll (I Just Wanna)", albumIndex: 0, popularity: 28 },
      { name: "Everybody Loves Eileen", albumIndex: 0, popularity: 40 },
      { name: "She's Gone", albumIndex: 0, popularity: 55 },
      { name: "I'll Never Let You Go", albumIndex: 0, popularity: 78 },
    ],
  },
  {
    name: "Extreme", normalized: "extreme", country: "US", years: "1985-present", genre: "hair metal",
    albums: [{ name: "Extreme", year: 1989 }, { name: "Pornograffitti", year: 1990 }, { name: "III Sides to Every Story", year: 1992 }],
    songs: [
      { name: "Kid Ego", albumIndex: 0, popularity: 8 },
      { name: "Play with Me", albumIndex: 0, popularity: 15 },
      { name: "Decadence Dance", albumIndex: 1, popularity: 25 },
      { name: "Get the Funk Out", albumIndex: 1, popularity: 35 },
      { name: "Hole Hearted", albumIndex: 1, popularity: 48 },
      { name: "Rest in Peace", albumIndex: 2, popularity: 55 },
      { name: "More Than Words", albumIndex: 1, popularity: 95 },
    ],
  },
  {
    name: "Bulletboys", normalized: "bulletboys", country: "US", years: "1986-present", genre: "hair metal",
    albums: [{ name: "BulletBoys", year: 1988 }, { name: "Freakshow", year: 1991 }],
    songs: [
      { name: "Hard as a Rock", albumIndex: 0, popularity: 10 },
      { name: "Kissin' Kitty", albumIndex: 0, popularity: 18 },
      { name: "For the Love of Money", albumIndex: 0, popularity: 28 },
      { name: "THC Groove", albumIndex: 1, popularity: 38 },
      { name: "Smooth Up in Ya", albumIndex: 0, popularity: 65 },
    ],
  },
  {
    name: "Dangerous Toys", normalized: "dangerous toys", country: "US", years: "1987-present", genre: "hair metal",
    albums: [{ name: "Dangerous Toys", year: 1989 }, { name: "Hellacious Acres", year: 1991 }],
    songs: [
      { name: "Take Me Drunk", albumIndex: 0, popularity: 10 },
      { name: "Sport'n a Woody", albumIndex: 0, popularity: 20 },
      { name: "That Dog", albumIndex: 0, popularity: 28 },
      { name: "Scared", albumIndex: 0, popularity: 38 },
      { name: "Teas'n, Pleas'n", albumIndex: 0, popularity: 55 },
    ],
  },
  {
    name: "Vixen", normalized: "vixen", country: "US", years: "1980-present", genre: "hair metal",
    albums: [{ name: "Vixen", year: 1988 }, { name: "Rev It Up", year: 1990 }],
    songs: [
      { name: "I Want You to Rock Me", albumIndex: 0, popularity: 10 },
      { name: "Desperate", albumIndex: 0, popularity: 18 },
      { name: "How Much Love", albumIndex: 1, popularity: 28 },
      { name: "Love Is a Killer", albumIndex: 1, popularity: 38 },
      { name: "Cryin'", albumIndex: 0, popularity: 48 },
      { name: "Edge of a Broken Heart", albumIndex: 0, popularity: 72 },
    ],
  },
  {
    name: "Queensrÿche", normalized: "queensryche", country: "US", years: "1982-present", genre: "hair metal",
    albums: [{ name: "Rage for Order", year: 1986 }, { name: "Operation: Mindcrime", year: 1988 }, { name: "Empire", year: 1990 }],
    songs: [
      { name: "Walk in the Shadows", albumIndex: 0, popularity: 10 },
      { name: "I Don't Believe in Love", albumIndex: 1, popularity: 22 },
      { name: "Eyes of a Stranger", albumIndex: 1, popularity: 30 },
      { name: "Jet City Woman", albumIndex: 2, popularity: 40 },
      { name: "Empire", albumIndex: 2, popularity: 52 },
      { name: "Another Rainy Night (Without You)", albumIndex: 2, popularity: 60 },
      { name: "Silent Lucidity", albumIndex: 2, popularity: 88 },
    ],
  },
  {
    name: "Yngwie Malmsteen", normalized: "yngwie malmsteen", country: "SE", years: "1978-present", genre: "hair metal",
    albums: [{ name: "Rising Force", year: 1984 }, { name: "Marching Out", year: 1985 }, { name: "Trilogy", year: 1986 }],
    songs: [
      { name: "Far Beyond the Sun", albumIndex: 0, popularity: 10 },
      { name: "Black Star", albumIndex: 0, popularity: 20 },
      { name: "I'll See the Light, Tonight", albumIndex: 1, popularity: 28 },
      { name: "Overture 1383", albumIndex: 1, popularity: 35 },
      { name: "You Don't Remember, I'll Never Forget", albumIndex: 2, popularity: 48 },
      { name: "Trilogy Suite Op: 5", albumIndex: 2, popularity: 60 },
    ],
  },
  {
    name: "Ozzy Osbourne", normalized: "ozzy osbourne", country: "UK", years: "1979-present", genre: "hair metal",
    albums: [{ name: "Blizzard of Ozz", year: 1980 }, { name: "Diary of a Madman", year: 1981 }, { name: "Bark at the Moon", year: 1983 }, { name: "No More Tears", year: 1991 }],
    songs: [
      { name: "Suicide Solution", albumIndex: 0, popularity: 15 },
      { name: "Over the Mountain", albumIndex: 1, popularity: 22 },
      { name: "Flying High Again", albumIndex: 1, popularity: 30 },
      { name: "Diary of a Madman", albumIndex: 1, popularity: 38 },
      { name: "Shot in the Dark", albumIndex: 2, popularity: 45 },
      { name: "Bark at the Moon", albumIndex: 2, popularity: 52 },
      { name: "No More Tears", albumIndex: 3, popularity: 62 },
      { name: "Mr. Crowley", albumIndex: 0, popularity: 72 },
      { name: "Mama, I'm Coming Home", albumIndex: 3, popularity: 80 },
      { name: "Crazy Train", albumIndex: 0, popularity: 96 },
    ],
  },
  {
    name: "Alice Cooper", normalized: "alice cooper", country: "US", years: "1964-present", genre: "hair metal",
    albums: [{ name: "Trash", year: 1989 }, { name: "Hey Stoopid", year: 1991 }, { name: "Welcome to My Nightmare", year: 1975 }],
    songs: [
      { name: "Bed of Nails", albumIndex: 0, popularity: 12 },
      { name: "Hey Stoopid", albumIndex: 1, popularity: 22 },
      { name: "Feed My Frankenstein", albumIndex: 1, popularity: 30 },
      { name: "Only Women Bleed", albumIndex: 2, popularity: 40 },
      { name: "Welcome to My Nightmare", albumIndex: 2, popularity: 48 },
      { name: "No More Mr. Nice Guy", albumIndex: 2, popularity: 58 },
      { name: "School's Out", albumIndex: 2, popularity: 72 },
      { name: "Poison", albumIndex: 0, popularity: 90 },
    ],
  },
  {
    name: "Dio", normalized: "dio", country: "US", years: "1982-2010", genre: "hair metal",
    albums: [{ name: "Holy Diver", year: 1983 }, { name: "The Last in Line", year: 1984 }, { name: "Sacred Heart", year: 1985 }],
    songs: [
      { name: "Don't Talk to Strangers", albumIndex: 0, popularity: 12 },
      { name: "Stand Up and Shout", albumIndex: 0, popularity: 20 },
      { name: "We Rock", albumIndex: 1, popularity: 30 },
      { name: "The Last in Line", albumIndex: 1, popularity: 40 },
      { name: "Sacred Heart", albumIndex: 2, popularity: 48 },
      { name: "Rainbow in the Dark", albumIndex: 0, popularity: 65 },
      { name: "Holy Diver", albumIndex: 0, popularity: 92 },
    ],
  },
  {
    name: "Judas Priest", normalized: "judas priest", country: "UK", years: "1969-present", genre: "hair metal",
    albums: [{ name: "Screaming for Vengeance", year: 1982 }, { name: "Defenders of the Faith", year: 1984 }, { name: "Turbo", year: 1986 }, { name: "Painkiller", year: 1990 }],
    songs: [
      { name: "Electric Eye", albumIndex: 0, popularity: 12 },
      { name: "Freewheel Burning", albumIndex: 1, popularity: 20 },
      { name: "Some Heads Are Gonna Roll", albumIndex: 1, popularity: 28 },
      { name: "Turbo Lover", albumIndex: 2, popularity: 38 },
      { name: "Painkiller", albumIndex: 3, popularity: 50 },
      { name: "Hell Bent for Leather", albumIndex: 0, popularity: 58 },
      { name: "Breaking the Law", albumIndex: 0, popularity: 72 },
      { name: "Living After Midnight", albumIndex: 0, popularity: 82 },
      { name: "You've Got Another Thing Comin'", albumIndex: 0, popularity: 92 },
    ],
  },
  {
    name: "Van Halen", normalized: "van halen", country: "US", years: "1972-2020", genre: "hair metal",
    albums: [{ name: "Van Halen", year: 1978 }, { name: "1984", year: 1984 }, { name: "5150", year: 1986 }, { name: "OU812", year: 1988 }],
    songs: [
      { name: "Ain't Talkin' 'bout Love", albumIndex: 0, popularity: 15 },
      { name: "Unchained", albumIndex: 0, popularity: 22 },
      { name: "Hot for Teacher", albumIndex: 1, popularity: 32 },
      { name: "Why Can't This Be Love", albumIndex: 2, popularity: 42 },
      { name: "Dreams", albumIndex: 2, popularity: 48 },
      { name: "When It's Love", albumIndex: 3, popularity: 55 },
      { name: "Runnin' with the Devil", albumIndex: 0, popularity: 62 },
      { name: "Panama", albumIndex: 1, popularity: 75 },
      { name: "Jump", albumIndex: 1, popularity: 95 },
    ],
  },
  {
    name: "Mötley Crüe", normalized: "motley crue", country: "US", years: "1981-2015, 2019-present", genre: "hair metal",
    albums: [{ name: "Shout at the Devil", year: 1983 }, { name: "Theatre of Pain", year: 1985 }, { name: "Girls, Girls, Girls", year: 1987 }, { name: "Dr. Feelgood", year: 1989 }, { name: "Too Fast for Love", year: 1981 }],
    songs: [
      { name: "Ten Seconds to Love", albumIndex: 0, popularity: 15 },
      { name: "Too Young to Fall in Love", albumIndex: 0, popularity: 25 },
      { name: "Looks That Kill", albumIndex: 0, popularity: 35 },
      { name: "Wild Side", albumIndex: 2, popularity: 42 },
      { name: "Same Ol' Situation", albumIndex: 3, popularity: 48 },
      { name: "Smokin' in the Boys Room", albumIndex: 1, popularity: 55 },
      { name: "Live Wire", albumIndex: 4, popularity: 58 },
      { name: "Shout at the Devil", albumIndex: 0, popularity: 65 },
      { name: "Home Sweet Home", albumIndex: 1, popularity: 72 },
      { name: "Dr. Feelgood", albumIndex: 3, popularity: 78 },
      { name: "Girls, Girls, Girls", albumIndex: 2, popularity: 85 },
      { name: "Kickstart My Heart", albumIndex: 3, popularity: 95 },
    ],
  },
  {
    name: "Guns N' Roses", normalized: "guns n roses", country: "US", years: "1985-1993, 2001-present", genre: "hard rock",
    albums: [{ name: "Appetite for Destruction", year: 1987 }, { name: "GN'R Lies", year: 1988 }, { name: "Use Your Illusion I", year: 1991 }, { name: "Use Your Illusion II", year: 1991 }],
    songs: [
      { name: "Think About You", albumIndex: 0, popularity: 12 },
      { name: "My Michelle", albumIndex: 0, popularity: 20 },
      { name: "Out Ta Get Me", albumIndex: 0, popularity: 25 },
      { name: "Used to Love Her", albumIndex: 1, popularity: 32 },
      { name: "Nightrain", albumIndex: 0, popularity: 40 },
      { name: "14 Years", albumIndex: 3, popularity: 45 },
      { name: "Don't Cry", albumIndex: 2, popularity: 55 },
      { name: "Patience", albumIndex: 1, popularity: 62 },
      { name: "November Rain", albumIndex: 2, popularity: 72 },
      { name: "Welcome to the Jungle", albumIndex: 0, popularity: 82 },
      { name: "Paradise City", albumIndex: 0, popularity: 88 },
      { name: "Sweet Child O' Mine", albumIndex: 0, popularity: 96 },
    ],
  },
  {
    name: "Def Leppard", normalized: "def leppard", country: "UK", years: "1977-present", genre: "hair metal",
    albums: [{ name: "Pyromania", year: 1983 }, { name: "Hysteria", year: 1987 }, { name: "High 'n' Dry", year: 1981 }, { name: "Adrenalize", year: 1992 }],
    songs: [
      { name: "Die Hard the Hunter", albumIndex: 0, popularity: 10 },
      { name: "Stagefright", albumIndex: 0, popularity: 18 },
      { name: "Gods of War", albumIndex: 1, popularity: 24 },
      { name: "Bringin' On the Heartbreak", albumIndex: 2, popularity: 35 },
      { name: "Let's Get Rocked", albumIndex: 3, popularity: 42 },
      { name: "Armageddon It", albumIndex: 1, popularity: 50 },
      { name: "Love Bites", albumIndex: 1, popularity: 58 },
      { name: "Rock of Ages", albumIndex: 0, popularity: 65 },
      { name: "Hysteria", albumIndex: 1, popularity: 72 },
      { name: "Animal", albumIndex: 1, popularity: 78 },
      { name: "Photograph", albumIndex: 0, popularity: 86 },
      { name: "Pour Some Sugar on Me", albumIndex: 1, popularity: 95 },
    ],
  },
  {
    name: "Kiss", normalized: "kiss", country: "US", years: "1973-2023", genre: "hair metal",
    albums: [{ name: "Destroyer", year: 1976 }, { name: "Love Gun", year: 1977 }, { name: "Lick It Up", year: 1983 }, { name: "Asylum", year: 1985 }],
    songs: [
      { name: "Flaming Youth", albumIndex: 0, popularity: 8 },
      { name: "Shout It Out Loud", albumIndex: 0, popularity: 18 },
      { name: "Calling Dr. Love", albumIndex: 1, popularity: 25 },
      { name: "Love Gun", albumIndex: 1, popularity: 32 },
      { name: "Lick It Up", albumIndex: 2, popularity: 42 },
      { name: "Tears Are Falling", albumIndex: 3, popularity: 48 },
      { name: "Beth", albumIndex: 0, popularity: 58 },
      { name: "Detroit Rock City", albumIndex: 0, popularity: 68 },
      { name: "I Was Made for Lovin' You", albumIndex: 1, popularity: 78 },
      { name: "Rock and Roll All Nite", albumIndex: 0, popularity: 95 },
    ],
  },
  {
    name: "Aerosmith", normalized: "aerosmith", country: "US", years: "1970-present", genre: "hard rock",
    albums: [{ name: "Toys in the Attic", year: 1975 }, { name: "Permanent Vacation", year: 1987 }, { name: "Pump", year: 1989 }, { name: "Get a Grip", year: 1993 }],
    songs: [
      { name: "Rag Doll", albumIndex: 1, popularity: 12 },
      { name: "Angel", albumIndex: 1, popularity: 20 },
      { name: "Love in an Elevator", albumIndex: 2, popularity: 32 },
      { name: "Janie's Got a Gun", albumIndex: 2, popularity: 42 },
      { name: "Cryin'", albumIndex: 3, popularity: 52 },
      { name: "Crazy", albumIndex: 3, popularity: 58 },
      { name: "Livin' on the Edge", albumIndex: 3, popularity: 65 },
      { name: "Sweet Emotion", albumIndex: 0, popularity: 72 },
      { name: "Walk This Way", albumIndex: 0, popularity: 82 },
      { name: "Dream On", albumIndex: 0, popularity: 88 },
      { name: "I Don't Want to Miss a Thing", albumIndex: 3, popularity: 95 },
    ],
  },
  {
    name: "W.A.S.P.", normalized: "wasp", country: "US", years: "1982-present", genre: "hair metal",
    albums: [{ name: "W.A.S.P.", year: 1984 }, { name: "The Last Command", year: 1985 }, { name: "The Headless Children", year: 1989 }],
    songs: [
      { name: "Tormentor", albumIndex: 0, popularity: 10 },
      { name: "On Your Knees", albumIndex: 0, popularity: 18 },
      { name: "Blind in Texas", albumIndex: 1, popularity: 28 },
      { name: "Wild Child", albumIndex: 1, popularity: 38 },
      { name: "The Real Me", albumIndex: 2, popularity: 45 },
      { name: "The Headless Children", albumIndex: 2, popularity: 52 },
      { name: "I Wanna Be Somebody", albumIndex: 0, popularity: 68 },
      { name: "Animal (F**k Like a Beast)", albumIndex: 0, popularity: 78 },
    ],
  },
  {
    name: "L.A. Guns", normalized: "la guns", country: "US", years: "1983-present", genre: "hair metal",
    albums: [{ name: "L.A. Guns", year: 1988 }, { name: "Cocked & Loaded", year: 1989 }],
    songs: [
      { name: "One More Reason", albumIndex: 0, popularity: 10 },
      { name: "No Mercy", albumIndex: 0, popularity: 18 },
      { name: "Sex Action", albumIndex: 0, popularity: 28 },
      { name: "Electric Gypsy", albumIndex: 0, popularity: 38 },
      { name: "Never Enough", albumIndex: 1, popularity: 48 },
      { name: "Rip and Tear", albumIndex: 1, popularity: 55 },
      { name: "The Ballad of Jayne", albumIndex: 1, popularity: 78 },
    ],
  },
  {
    name: "Hanoi Rocks", normalized: "hanoi rocks", country: "FI", years: "1979-1985, 2001-2009", genre: "hair metal",
    albums: [{ name: "Back to Mystery City", year: 1983 }, { name: "Two Steps from the Move", year: 1984 }],
    songs: [
      { name: "Malibu Beach Nightmare", albumIndex: 0, popularity: 8 },
      { name: "Tragedy", albumIndex: 0, popularity: 15 },
      { name: "Back to Mystery City", albumIndex: 0, popularity: 25 },
      { name: "Up Around the Bend", albumIndex: 1, popularity: 35 },
      { name: "Don't You Ever Leave Me", albumIndex: 1, popularity: 48 },
      { name: "Underwater World", albumIndex: 1, popularity: 60 },
    ],
  },
  {
    name: "Bang Tango", normalized: "bang tango", country: "US", years: "1987-present", genre: "hair metal",
    albums: [{ name: "Psycho Cafe", year: 1989 }],
    songs: [
      { name: "Attack of Life", albumIndex: 0, popularity: 8 },
      { name: "Wrap My Wings", albumIndex: 0, popularity: 18 },
      { name: "Breaking Up a Heart of Stone", albumIndex: 0, popularity: 28 },
      { name: "Someone Like You", albumIndex: 0, popularity: 48 },
    ],
  },
  {
    name: "Tyketto", normalized: "tyketto", country: "US", years: "1987-present", genre: "hair metal",
    albums: [{ name: "Don't Come Easy", year: 1991 }],
    songs: [
      { name: "Burning Down Inside", albumIndex: 0, popularity: 8 },
      { name: "Sail Away", albumIndex: 0, popularity: 18 },
      { name: "Standing Alone", albumIndex: 0, popularity: 28 },
      { name: "Wings", albumIndex: 0, popularity: 42 },
      { name: "Forever Young", albumIndex: 0, popularity: 62 },
    ],
  },
];

async function seedAll() {
  let created = 0;
  let skipped = 0;

  for (const data of artistData) {
    try {
      // Check if artist already exists
      const existing = await db
        .select()
        .from(artists)
        .where(eq(artists.nameNormalized, data.normalized))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Create artist
      const [artist] = await db
        .insert(artists)
        .values({
          name: data.name,
          nameNormalized: data.normalized,
          country: data.country,
          activeYears: data.years,
          contentType: "music",
        })
        .returning();

      // Create albums
      const createdAlbums = [];
      for (const a of data.albums) {
        const [album] = await db.insert(albums).values({ artistId: artist.id, name: a.name, year: a.year }).returning();
        createdAlbums.push(album);
      }

      // Create songs
      const createdSongs = [];
      for (const s of data.songs) {
        const [song] = await db
          .insert(songs)
          .values({
            name: s.name,
            artistId: artist.id,
            albumId: createdAlbums[s.albumIndex].id,
            popularity: s.popularity,
          })
          .returning();
        createdSongs.push(song);
      }

      // Create puzzle
      const [puzzle] = await db
        .insert(puzzles)
        .values({
          mode: "artist",
          contentType: "music",
          artistId: artist.id,
          primaryGenre: data.genre,
          qualityScore: 85,
          published: true,
          approvedBy: "seed",
          approvedAt: new Date(),
        })
        .returning();

      // Link songs
      for (let i = 0; i < createdSongs.length; i++) {
        await db.insert(puzzleSongs).values({
          puzzleId: puzzle.id,
          songId: createdSongs[i].id,
          displayOrder: i + 1,
        });
      }

      created++;
      console.log(`✓ ${data.name} (${createdSongs.length} songs)`);
    } catch (err) {
      console.error(`✗ ${data.name}: ${err}`);
    }
  }

  console.log(`\nDone! Created ${created} puzzles, skipped ${skipped} (already existed).`);
}

seedAll().catch(console.error);
