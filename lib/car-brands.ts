// Base de datos de marcas y modelos populares en España
export const CAR_BRANDS: Record<string, string[]> = {
  "Abarth": ["500", "595", "695", "Punto"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "Giulietta", "MiTo"],
  "Audi": ["A1", "A3", "A4", "A4 Avant", "A5", "A6", "A6 Avant", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "e-tron", "e-tron GT", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "S4", "S5", "TT"],
  "BMW": ["Serie 1", "Serie 2", "Serie 3", "Serie 4", "Serie 5", "Serie 7", "Serie 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX", "iX1", "iX3", "M2", "M3", "M4", "M5"],
  "Citroën": ["C3", "C3 Aircross", "C4", "C4 X", "C5 Aircross", "C5 X", "Berlingo", "ë-C4", "ë-Berlingo"],
  "Cupra": ["Born", "Formentor", "Leon", "Ateca", "Tavascan"],
  "Dacia": ["Sandero", "Duster", "Jogger", "Spring"],
  "DS": ["DS 3", "DS 4", "DS 7", "DS 9"],
  "Fiat": ["500", "500e", "500X", "500L", "Panda", "Tipo", "Punto"],
  "Ford": ["Fiesta", "Focus", "Focus ST", "Kuga", "Puma", "Mustang", "Mustang Mach-E", "Explorer", "Ranger", "Transit", "Tourneo"],
  "Honda": ["Civic", "CR-V", "HR-V", "Jazz", "ZR-V", "e:Ny1"],
  "Hyundai": ["i10", "i20", "i30", "Kona", "Tucson", "Santa Fe", "IONIQ 5", "IONIQ 6", "Bayon"],
  "Jaguar": ["E-PACE", "F-PACE", "I-PACE", "XE", "XF", "F-TYPE"],
  "Jeep": ["Renegade", "Compass", "Cherokee", "Wrangler", "Grand Cherokee", "Avenger"],
  "Kia": ["Picanto", "Rio", "Ceed", "XCeed", "Sportage", "Sorento", "Niro", "EV6", "EV9", "Stonic", "Stinger"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "Lexus": ["CT", "IS", "ES", "NX", "RX", "UX", "LC", "LS", "LBX"],
  "Mazda": ["2", "3", "CX-3", "CX-30", "CX-5", "CX-60", "MX-5", "MX-30"],
  "Mercedes-Benz": ["Clase A", "Clase B", "Clase C", "Clase E", "Clase S", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "EQA", "EQB", "EQC", "EQE", "EQS", "AMG GT", "Vito", "Sprinter"],
  "MINI": ["Cooper", "Countryman", "Clubman", "Electric"],
  "Mitsubishi": ["ASX", "Eclipse Cross", "Outlander", "Space Star"],
  "Nissan": ["Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "Micra", "Navara"],
  "Opel": ["Corsa", "Astra", "Mokka", "Crossland", "Grandland", "Insignia", "Combo", "Zafira"],
  "Peugeot": ["208", "308", "408", "508", "2008", "3008", "5008", "e-208", "e-308", "e-2008", "Rifter", "Partner"],
  "Porsche": ["911", "718 Cayman", "718 Boxster", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Renault": ["Clio", "Captur", "Mégane", "Mégane E-Tech", "Arkana", "Austral", "Espace", "Scénic", "Koleos", "ZOE", "Kangoo", "Trafic"],
  "SEAT": ["Ibiza", "León", "Arona", "Ateca", "Tarraco"],
  "Škoda": ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq"],
  "Smart": ["ForTwo", "ForFour", "#1", "#3"],
  "Subaru": ["Impreza", "XV", "Forester", "Outback", "BRZ", "Solterra"],
  "Suzuki": ["Swift", "Ignis", "Vitara", "S-Cross", "Jimny", "Across"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X"],
  "Toyota": ["Aygo X", "Yaris", "Yaris Cross", "Corolla", "C-HR", "RAV4", "Highlander", "Land Cruiser", "Supra", "bZ4X", "Proace", "Hilux"],
  "Volkswagen": ["Polo", "Golf", "Golf GTI", "Golf R", "T-Roc", "T-Cross", "Tiguan", "Touareg", "Arteon", "Passat", "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz", "Caddy", "Transporter"],
  "Volvo": ["XC40", "XC60", "XC90", "C40", "S60", "S90", "V60", "V90", "EX30", "EX90"],
}

export function getAllBrands(): string[] {
  return Object.keys(CAR_BRANDS).sort()
}

export function getModelsForBrand(brand: string): string[] {
  return CAR_BRANDS[brand] || []
}

export function searchBrandsAndModels(query: string): { brand: string; model?: string }[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase().trim()
  const results: { brand: string; model?: string }[] = []

  for (const [brand, models] of Object.entries(CAR_BRANDS)) {
    if (brand.toLowerCase().includes(q)) {
      results.push({ brand })
    }
    for (const model of models) {
      const fullName = `${brand} ${model}`.toLowerCase()
      if (fullName.includes(q) || model.toLowerCase().includes(q)) {
        results.push({ brand, model })
      }
    }
  }

  return results.slice(0, 10) // Limit to 10 suggestions
}
