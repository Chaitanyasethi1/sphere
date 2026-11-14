import type { MoverCandidate } from "@/types";

export interface NasaStory {
  id: string;
  title: string;
  titleLines: string[];
  subtitle: string;
  date: string;
  category: string;
  whatIsIt: string;
  whatIsItDoing: string;
  craftType: "voyager" | "clipper" | "roman" | "parker" | "ceres" | "candidate";
  orbitColor: string;
  telemetry: {
    distance: string;
    speed: string;
    destination: string;
    launchDate: string;
    missionPhase: string;
  };
  ra: number;
  dec: number;
}

export const NASA_FEATURED_STORIES: NasaStory[] = [
  {
    id: "voyager-1",
    title: "Voyager One Light-Day",
    titleLines: ["Voyager One", "Light-Day"],
    subtitle: "NOVEMBER 18TH, 2026",
    date: "2026-11-18T00:00:00Z",
    category: "INTERSTELLAR MISSION",
    whatIsIt:
      "Voyager 1 is humanity's most distant robotic emissary. Launched by NASA on September 5, 1977, the spacecraft has traveled beyond the heliopause into interstellar space—the region between stars filled with gas, dust, and cosmic rays from exploded stars.",
    whatIsItDoing:
      "Crossing a milestone distance of one full light-day (over 25.9 billion kilometers / 173 AU) from the Sun. Its High-Gain Antenna continuously transmits data on interstellar magnetic fields, cosmic ray density, and plasma waves back to NASA's Deep Space Network, taking over 24 hours each way for radio signals to travel.",
    craftType: "voyager",
    orbitColor: "#d4a373", // Warm golden sand
    telemetry: {
      distance: "173.2 AU (25.9B km)",
      speed: "16.9 km/s (38,000 mph)",
      destination: "Ophiuchus constellation / Interstellar void",
      launchDate: "September 5, 1977",
      missionPhase: "Voyager Interstellar Mission (VIM)",
    },
    ra: 268.25,
    dec: 12.05,
  },
  {
    id: "europa-clipper",
    title: "Europa Clipper Earth Gravity Assist",
    titleLines: ["Europa Clipper", "Earth Gravity", "Assist"],
    subtitle: "EARTH FLYBY ON DECEMBER 3RD, 2026",
    date: "2026-12-03T00:00:00Z",
    category: "OUTER PLANETS EXPLORATION",
    whatIsIt:
      "NASA's flagship interplanetary probe designed to conduct detailed reconnaissance of Jupiter's moon Europa. Planetary scientists have strong evidence that beneath Europa's cracked ice crust lies a global salt-water ocean containing more water than all of Earth's oceans combined, creating conditions potentially suitable for life.",
    whatIsItDoing:
      "Conducting a critical Earth Gravity Assist flyby to gain orbital velocity needed to reach the Jovian system in 2030. During the close approach, the flight team tests and calibrates its massive 30-meter solar array wings, ice-penetrating radar antennas, and magnetometer instruments against Earth's magnetosphere.",
    craftType: "clipper",
    orbitColor: "#68a8cf", // Pale sky cyan
    telemetry: {
      distance: "1.02 AU from Sun",
      speed: "34.2 km/s relative to Sun",
      destination: "Jupiter & Europa (Arrival: 2030)",
      launchDate: "October 14, 2024",
      missionPhase: "Inner Solar System Gravity Assist",
    },
    ra: 271.45,
    dec: -5.32,
  },
  {
    id: "roman-space-telescope",
    title: "Roman Space Telescope Launch",
    titleLines: ["Roman Space", "Telescope", "Launch"],
    subtitle: "MISSION LAUNCH AUGUST 30TH, 2026",
    date: "2026-08-30T00:00:00Z",
    category: "ASTROPHYSICS OBSERVATORY",
    whatIsIt:
      "The Nancy Grace Roman Space Telescope is NASA's next-generation wide-field infrared observatory. Featuring a 2.4-meter primary mirror with a field of view 100 times larger than the Hubble Space Telescope, Roman will survey billions of galaxies, map dark matter distributions, and directly image exoplanets with an advanced starlight coronagraph.",
    whatIsItDoing:
      "Completing final launch readiness and space vehicle checkout for launch atop a Falcon Heavy to the Sun-Earth Lagrange point L2. Its Wide Field Instrument (WFI) will complement SPHEREx by conducting high-resolution near-infrared spectroscopy and deep cosmological surveys.",
    craftType: "roman",
    orbitColor: "#a278b5", // Soft lavender
    telemetry: {
      distance: "1.5M km from Earth (Sun-Earth L2)",
      speed: "Stationary halo orbit at L2",
      destination: "Sun-Earth Lagrange Point 2",
      launchDate: "August 30, 2026",
      missionPhase: "Launch & Observatory Commissioning",
    },
    ra: 269.85,
    dec: 66.85,
  },
  {
    id: "parker-solar-probe",
    title: "Parker Solar Probe Solar Touch",
    titleLines: ["Parker Solar", "Probe", "Solar Touch"],
    subtitle: "PERIHELION PASS DECEMBER 24TH, 2026",
    date: "2026-12-24T00:00:00Z",
    category: "HELIOPHYSICS FLAGSHIP",
    whatIsIt:
      "NASA's historic robotic mission that 'touches the Sun'. Flying through the solar corona at temperatures exceeding a million degrees Celsius, Parker Solar Probe solves fundamental mysteries of how solar energetic particles accelerate and why the corona is hundreds of times hotter than the visible solar surface.",
    whatIsItDoing:
      "Swooping through extreme perihelion only 6.1 million kilometers from the Sun's surface, shielded by an 11.4-cm-thick carbon-composite heat shield. Moving at a staggering 692,000 km/h (430,000 mph)—making it the fastest human-made object ever constructed—it measures solar magnetic switchbacks and coronal mass ejections in situ.",
    craftType: "parker",
    orbitColor: "#cbd5e1", // Titanium silver
    telemetry: {
      distance: "0.046 AU from Sun (6.1M km)",
      speed: "192 km/s (692,000 km/h)",
      destination: "Inner Solar Corona",
      launchDate: "August 12, 2018",
      missionPhase: "Close Solar Encounter #22",
    },
    ra: 265.12,
    dec: 23.44,
  },
  {
    id: "1-ceres",
    title: "1 Ceres Dwarf Planet & Ice Mantle",
    titleLines: ["1 Ceres", "Dwarf Planet", "Cryomagma"],
    subtitle: "MAIN BELT ORBIT OCTOBER 15TH, 2026",
    date: "2026-10-15T00:00:00Z",
    category: "DWARF PLANET / ASTEROID",
    whatIsIt:
      "1 Ceres is the largest object in the asteroid belt between Mars and Jupiter and the only dwarf planet in the inner solar system. With a diameter of 940 km, it contains a rocky core, a water-ice mantle, and active cryovolcanoes like Ahuna Mons that erupt briny sodium carbonate mud instead of molten rock.",
    whatIsItDoing:
      "Orbiting the Sun in a 4.6-year heliocentric orbit at 2.77 AU. SPHEREx multi-epoch infrared cutouts observe variable hydration absorption bands (3.0 µm OH/H2O features) across its bright faculae in Occator Crater, monitoring seasonal water-ice sublimation and outgassing.",
    craftType: "ceres",
    orbitColor: "#d96b43", // Mars / asteroid rust
    telemetry: {
      distance: "2.77 AU from Sun (414M km)",
      speed: "17.9 km/s orbital velocity",
      destination: "Main Asteroid Belt (Stable orbit)",
      launchDate: "Discovered Jan 1, 1801 by Piazzi",
      missionPhase: "SPHEREx All-Sky Spectral Monitoring",
    },
    ra: 270.265,
    dec: 66.698,
  },
];

/**
 * Returns rich scientific "What is it?" and "What is it doing?" description
 * for any mover candidate (including pipeline SPX-MOV candidates).
 */
export function getMoverDescription(mover: MoverCandidate): {
  whatIsIt: string;
  whatIsItDoing: string;
  category: string;
  destination: string;
  speedStr: string;
  craftType: "voyager" | "clipper" | "roman" | "parker" | "ceres" | "candidate";
} {
  // Check if it matches a known featured story
  const matchedStory = NASA_FEATURED_STORIES.find(
    (s) =>
      s.id === mover.object_id.toLowerCase() ||
      (mover.match_name && s.title.toLowerCase().includes(mover.match_name.toLowerCase()))
  );

  if (matchedStory) {
    return {
      whatIsIt: matchedStory.whatIsIt,
      whatIsItDoing: matchedStory.whatIsItDoing,
      category: matchedStory.category,
      destination: matchedStory.telemetry.destination,
      speedStr: matchedStory.telemetry.speed,
      craftType: matchedStory.craftType,
    };
  }

  // Known catalog asteroids (e.g. 1 Ceres, 2 Pallas, etc.)
  if (mover.type === "known") {
    const name = mover.match_name || mover.object_id;
    return {
      whatIsIt: `${name} is an officially cataloged Solar System body verified against IMCCE SkyBoT and NASA/JPL Horizons ephemerides. It possesses a confirmed Keplerian orbit within our solar system, with documented physical parameters and spectrophotometric properties across standard astronomical catalogs.`,
      whatIsItDoing: `Currently moving along its heliocentric trajectory, captured across ${mover.detections?.length || 1} SPHEREx survey epochs. Its 102-channel spectrophotometry ($0.75 - 5.0\\,\\mu\\text{m}$) is being mapped to extract mineral composition, surface ice absorption bands, and thermal emission signatures.`,
      category: "CONFIRMED SOLAR SYSTEM OBJECT",
      destination: "Heliocentric Orbit",
      speedStr: `${((mover.motion?.ra_rate_arcsec_per_day || 0) ** 2 + (mover.motion?.dec_rate_arcsec_per_day || 0) ** 2) ** 0.5 > 0 ? (((mover.motion?.ra_rate_arcsec_per_day || 0) ** 2 + (mover.motion?.dec_rate_arcsec_per_day || 0) ** 2) ** 0.5).toFixed(1) : "18.5"} "/day apparent motion`,
      craftType: "ceres",
    };
  }

  // Unknown candidates / Planet X candidates
  const rate = Math.sqrt(
    (mover.motion?.ra_rate_arcsec_per_day || 0) ** 2 +
      (mover.motion?.dec_rate_arcsec_per_day || 0) ** 2
  );

  return {
    whatIsIt: `A newly detected high-proper-motion candidate (${mover.object_id}) flagged by the SPHEREx multi-epoch transient linking pipeline. It does not match known asteroids, comets, or planets in the SkyBoT or JPL Horizons catalogs within a 15 arcsecond radius, qualifying it as a candidate for follow-up observation.`,
    whatIsItDoing: `Transiting the SPHEREx deep survey field at an apparent angular velocity of ${rate.toFixed(1)} arcseconds per day. Astrometric tracklet linking connects ${mover.detections?.length || 1} epoch detections to compute preliminary parabolic orbit constraints. Multi-channel infrared spectrophotometry reveals whether its spectral slope resembles carbonaceous chondrites, silicate-rich bodies, or an outer Kuiper-belt icy object.`,
    category: "UNCATALOGED SOLAR SYSTEM CANDIDATE",
    destination: "Candidate Outer System Orbit",
    speedStr: `${rate.toFixed(1)} "/day apparent rate`,
    craftType: "candidate",
  };
}

/**
 * Converts a featured story into a MoverCandidate object for the detail panel & camera.
 */
export function storyToCandidate(story: NasaStory): MoverCandidate {
  return {
    object_id: story.id,
    ra: story.ra,
    dec: story.dec,
    type: "known",
    match_name: story.title,
    confidence: 0.99,
    is_synthetic: false,
    motion: {
      ra_rate_arcsec_per_day: 15.0,
      dec_rate_arcsec_per_day: -5.0,
    },
    detections: [
      {
        epoch_id: "epoch_01",
        date: story.date,
        ra: story.ra,
        dec: story.dec,
        flux: 950,
        cutout_url: "",
      },
    ],
    spectrum: null,
  };
}
