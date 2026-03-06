export interface GarageListing {
  name: string;
  area: string;
  pincode: string;
  type: string;
  rating: number;
  maps_url: string;
  phone?: string;
}

export const garageListings: GarageListing[] = [
  // === Adyar – 600020 ===
  { name: "Speed Motors", area: "Adyar", pincode: "600020", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Speed+Motors+Adyar+Chennai+600020" },
  { name: "GoMechanic – Car Service Center Adyar", area: "Adyar", pincode: "600020", type: "Car", rating: 5.0, maps_url: "https://www.google.com/maps/search/?api=1&query=GoMechanic+Car+Service+Center+Rukmani+Nagar+Adyar+Chennai" },
  { name: "Sethu Auto Works", area: "Adyar", pincode: "600020", type: "Car", rating: 4.9, maps_url: "https://www.google.com/maps/search/?api=1&query=Sethu+Auto+Works+Adyar+Chennai+600020" },
  { name: "ICD Tuning", area: "Adyar", pincode: "600020", type: "Car", rating: 4.8, maps_url: "https://www.google.com/maps/search/?api=1&query=ICD+Tuning+Adyar+Chennai+600020" },
  { name: "Grace Automobiles", area: "Adyar", pincode: "600020", type: "Bike", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Grace+Automobiles+28th+Cross+St+Indira+Nagar+Adyar+Chennai" },
  { name: "BALAJI AUTO ELECTRICALS", area: "Adyar", pincode: "600020", type: "Auto Electrical", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=BALAJI+AUTO+ELECTRICALS+Adyar+Chennai+600020" },
  { name: "S.V. Venus Auto Garage", area: "Adyar", pincode: "600020", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=SV+Venus+Auto+Garage+Adyar+Chennai+600020" },
  { name: "KTM Authorised Service Center, Jai Motors", area: "Adyar", pincode: "600020", type: "Bike", rating: 4.0, maps_url: "https://www.google.com/maps/search/?api=1&query=KTM+Authorised+Service+Center+Jai+Motors+Adyar+Chennai" },
  { name: "Welcome Autoworks", area: "Adyar", pincode: "600020", type: "Bike", rating: 4.0, maps_url: "https://www.google.com/maps/search/?api=1&query=Welcome+Autoworks+Indira+Nagar+Adyar+Chennai" },
  { name: "Wheels Auto", area: "Adyar", pincode: "600020", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Auto+Repair+Adyar+Chennai" },

  // === Anna Nagar – 600040 ===
  { name: "Sri Sakthi Auto Garage", area: "Anna Nagar", pincode: "600040", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Sakthi+Auto+Garage+Anna+Nagar+Chennai" },
  { name: "AutoServe Car Care", area: "Anna Nagar", pincode: "600040", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=AutoServe+Car+Care+Anna+Nagar+Chennai" },
  { name: "Maruti Suzuki Service (Popular Vehicles)", area: "Anna Nagar", pincode: "600102", type: "Car", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Maruti+Suzuki+Service+Anna+Nagar+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Anna Nagar", pincode: "600040", type: "Bike", rating: 4.1, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Anna+Nagar+Chennai" },
  { name: "Bosch Car Service – Anna Nagar", area: "Anna Nagar", pincode: "600040", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Anna+Nagar+Chennai" },
  { name: "Victory Auto Garage", area: "Anna Nagar", pincode: "600102", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Garage+Anna+Nagar+Chennai" },
  { name: "Balaji Motors", area: "Anna Nagar", pincode: "600040", type: "Car / Bike", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Balaji+Motors+Anna+Nagar+West+Chennai" },
  { name: "Om Sai Auto Works", area: "Anna Nagar", pincode: "600040", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sai+Auto+Works+Anna+Nagar+Chennai" },
  { name: "Sri Venkateswara Auto Garage", area: "Anna Nagar", pincode: "600040", type: "Car", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Venkateswara+Auto+Garage+Anna+Nagar+Chennai" },
  { name: "Wheels Zone", area: "Anna Nagar", pincode: "600040", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Anna+Nagar+Chennai" },

  // === Velachery – 600042 ===
  { name: "Harshith Car A/C And Electricals", area: "Velachery", pincode: "600042", type: "Car", rating: 4.5, maps_url: "https://maps.app.goo.gl/fKiDchep6Pfci2ru5" },
  { name: "Velachery Auto Works", area: "Velachery", pincode: "600042", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Velachery+Auto+Works+Chennai" },
  { name: "AK Motors", area: "Velachery", pincode: "600042", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=AK+Motors+Velachery+Chennai" },
  { name: "Perfect Car Care", area: "Velachery", pincode: "600042", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Velachery+Chennai" },
  { name: "Sai Bike Service", area: "Velachery", pincode: "600042", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Bike+Service+Velachery+Chennai" },
  { name: "Bosch Car Service Velachery", area: "Velachery", pincode: "600042", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Velachery+Chennai" },
  { name: "Sri Ram Auto Garage", area: "Velachery", pincode: "600042", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Garage+Velachery+Chennai" },
  { name: "Kumar Auto Works", area: "Velachery", pincode: "600042", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Kumar+Auto+Works+Velachery+Chennai" },
  { name: "Victory Motors", area: "Velachery", pincode: "600042", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Motors+Velachery+Chennai" },
  { name: "Auto Doctor", area: "Velachery", pincode: "600042", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Velachery+Chennai" },

  // === T Nagar – 600017 ===
  { name: "Sakthi Auto Garage", area: "T. Nagar", pincode: "600017", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sakthi+Auto+Garage+T+Nagar+Chennai" },
  { name: "Chennai Car Care", area: "T. Nagar", pincode: "600017", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Chennai+Car+Care+T+Nagar+Chennai" },
  { name: "Royal Enfield Service Centre", area: "T. Nagar", pincode: "600017", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+T+Nagar+Chennai" },
  { name: "Bosch Car Service T Nagar", area: "T. Nagar", pincode: "600017", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+T+Nagar+Chennai" },
  { name: "Sri Balaji Motors", area: "T. Nagar", pincode: "600017", type: "Car / Bike", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Balaji+Motors+T+Nagar+Chennai" },
  { name: "Auto Doctor", area: "T. Nagar", pincode: "600017", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+T+Nagar+Chennai" },
  { name: "Victory Auto Works", area: "T. Nagar", pincode: "600017", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+T+Nagar+Chennai" },
  { name: "Wheels Care", area: "T. Nagar", pincode: "600017", type: "Car", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Care+T+Nagar+Chennai" },
  { name: "Sai Auto Garage", area: "T. Nagar", pincode: "600017", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+T+Nagar+Chennai" },
  { name: "Perfect Motors", area: "T. Nagar", pincode: "600017", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Motors+T+Nagar+Chennai" },

  // === Porur – 600116 ===
  { name: "Porur Auto Works", area: "Porur", pincode: "600116", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Porur+Auto+Works+Chennai" },
  { name: "Bosch Car Service Porur", area: "Porur", pincode: "600116", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Porur+Chennai" },
  { name: "Sri Vignesh Auto Garage", area: "Porur", pincode: "600116", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Vignesh+Auto+Garage+Porur+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Porur", pincode: "600116", type: "Bike", rating: 4.1, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Porur+Chennai" },
  { name: "Sai Car Care", area: "Porur", pincode: "600116", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Car+Care+Porur+Chennai" },
  { name: "Om Sakthi Motors", area: "Porur", pincode: "600116", type: "Car", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Porur+Chennai" },
  { name: "Wheels Zone Porur", area: "Porur", pincode: "600116", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Porur+Chennai" },
  { name: "Auto Doctor Porur", area: "Porur", pincode: "600116", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Porur+Chennai" },
  { name: "Victory Motors", area: "Porur", pincode: "600116", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Motors+Porur+Chennai" },
  { name: "Sri Ram Auto Works", area: "Porur", pincode: "600116", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Works+Porur+Chennai" },

  // === Tambaram – 600045 ===
  { name: "Tambaram Auto Works", area: "Tambaram", pincode: "600045", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Tambaram+Auto+Works+Chennai" },
  { name: "Bosch Car Service Tambaram", area: "Tambaram", pincode: "600045", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Tambaram+Chennai" },
  { name: "Sri Balaji Motors", area: "Tambaram", pincode: "600045", type: "Car / Bike", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Balaji+Motors+Tambaram+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Tambaram", pincode: "600045", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Tambaram+Chennai" },
  { name: "Sai Auto Garage", area: "Tambaram", pincode: "600045", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Tambaram+Chennai" },
  { name: "Victory Auto Works", area: "Tambaram", pincode: "600045", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Tambaram+Chennai" },
  { name: "Perfect Car Care", area: "Tambaram", pincode: "600045", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Tambaram+Chennai" },
  { name: "Om Sakthi Motors", area: "Tambaram", pincode: "600045", type: "Car", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Tambaram+Chennai" },
  { name: "Wheels Zone", area: "Tambaram", pincode: "600045", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Tambaram+Chennai" },
  { name: "Auto Doctor", area: "Tambaram", pincode: "600045", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Tambaram+Chennai" },

  // === Medavakkam – 600100 ===
  { name: "Medavakkam Auto Garage", area: "Medavakkam", pincode: "600100", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Medavakkam+Auto+Garage+Chennai" },
  { name: "Bosch Car Service Medavakkam", area: "Medavakkam", pincode: "600100", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Medavakkam+Chennai" },
  { name: "Sri Ram Motors", area: "Medavakkam", pincode: "600100", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Motors+Medavakkam+Chennai" },
  { name: "Sai Bike Service", area: "Medavakkam", pincode: "600100", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Bike+Service+Medavakkam+Chennai" },
  { name: "Victory Auto Care", area: "Medavakkam", pincode: "600100", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Care+Medavakkam+Chennai" },
  { name: "Perfect Motors", area: "Medavakkam", pincode: "600100", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Motors+Medavakkam+Chennai" },
  { name: "Om Sai Auto Works", area: "Medavakkam", pincode: "600100", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sai+Auto+Works+Medavakkam+Chennai" },
  { name: "Wheels Care", area: "Medavakkam", pincode: "600100", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Care+Medavakkam+Chennai" },
  { name: "Sri Vignesh Auto Works", area: "Medavakkam", pincode: "600100", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Vignesh+Auto+Works+Medavakkam+Chennai" },
  { name: "Auto Doctor Medavakkam", area: "Medavakkam", pincode: "600100", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Medavakkam+Chennai" },

  // === OMR – 600096/600097/600119 ===
  { name: "OMR Auto Works", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=OMR+Auto+Works+Perungudi+Chennai" },
  { name: "Bosch Car Service OMR", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+OMR+Chennai" },
  { name: "Sri Balaji Motors", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Balaji+Motors+Sholinganallur+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Sholinganallur", pincode: "600097", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+OMR+Chennai" },
  { name: "Perfect Car Care", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Thoraipakkam+Chennai" },
  { name: "Sai Auto Garage", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Perungudi+Chennai" },
  { name: "Victory Auto Works", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Sholinganallur+Chennai" },
  { name: "Wheels Zone OMR", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Karapakkam+Chennai" },
  { name: "Om Sakthi Motors", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Thoraipakkam+Chennai" },
  { name: "Auto Doctor OMR", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Perungudi+Chennai" },

  // === Chromepet – 600044 ===
  { name: "Chromepet Auto Works", area: "Chromepet", pincode: "600044", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Chromepet+Auto+Works+Chennai" },
  { name: "Bosch Car Service Chromepet", area: "Chromepet", pincode: "600044", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Chromepet+Chennai" },
  { name: "Sri Ram Auto Garage", area: "Chromepet", pincode: "600044", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Garage+Chromepet+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Chromepet", pincode: "600044", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Chromepet+Chennai" },
  { name: "Sai Motors", area: "Chromepet", pincode: "600044", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Motors+Chromepet+Chennai" },
  { name: "Perfect Car Care", area: "Chromepet", pincode: "600044", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Chromepet+Chennai" },
  { name: "Victory Auto Works", area: "Chromepet", pincode: "600044", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Chromepet+Chennai" },
  { name: "Om Sai Auto Garage", area: "Chromepet", pincode: "600044", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sai+Auto+Garage+Chromepet+Chennai" },
  { name: "Wheels Care", area: "Chromepet", pincode: "600044", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Care+Chromepet+Chennai" },
  { name: "Auto Doctor Chromepet", area: "Chromepet", pincode: "600044", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Chromepet+Chennai" },

  // === Ambattur – 600053 ===
  { name: "Ambattur Auto Works", area: "Ambattur", pincode: "600053", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Ambattur+Auto+Works+Chennai" },
  { name: "Bosch Car Service Ambattur", area: "Ambattur", pincode: "600053", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Ambattur+Chennai" },
  { name: "Sri Vignesh Motors", area: "Ambattur", pincode: "600053", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Vignesh+Motors+Ambattur+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Ambattur", pincode: "600053", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Ambattur+Chennai" },
  { name: "Sai Auto Garage", area: "Ambattur", pincode: "600053", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Ambattur+Chennai" },
  { name: "Victory Motors", area: "Ambattur", pincode: "600053", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Motors+Ambattur+Chennai" },
  { name: "Perfect Car Care", area: "Ambattur", pincode: "600053", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Ambattur+Chennai" },
  { name: "Om Sakthi Motors", area: "Ambattur", pincode: "600053", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Ambattur+Chennai" },
  { name: "Wheels Zone", area: "Ambattur", pincode: "600053", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Ambattur+Chennai" },
  { name: "Auto Doctor Ambattur", area: "Ambattur", pincode: "600053", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Ambattur+Chennai" },

  // === Sholinganallur – 600119 ===
  { name: "OMR Auto Works", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=OMR+Auto+Works+Sholinganallur+Chennai" },
  { name: "Sri Balaji Motors", area: "Sholinganallur", pincode: "600119", type: "Car / Bike", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Balaji+Motors+Sholinganallur+Chennai" },
  { name: "Victory Auto Works", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Sholinganallur+Chennai" },
  { name: "Wheels Zone", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Sholinganallur+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Sholinganallur", pincode: "600119", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Sholinganallur+Chennai" },
  { name: "Bosch Car Service Sholinganallur", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Sholinganallur+Chennai" },
  { name: "Sai Auto Garage", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Sholinganallur+Chennai" },
  { name: "Auto Doctor OMR", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Sholinganallur+Chennai" },
  { name: "Om Sakthi Motors", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Sholinganallur+Chennai" },
  { name: "Perfect Car Care", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Sholinganallur+Chennai" },

  // === Perungudi – 600096 ===
  { name: "Perungudi Auto Works", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Perungudi+Auto+Works+Chennai" },
  { name: "Victory Auto Works", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Perungudi+Chennai" },
  { name: "Sai Auto Garage", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Perungudi+Chennai" },
  { name: "Wheels Zone", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Perungudi+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Perungudi", pincode: "600096", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Perungudi+Chennai" },
  { name: "Bosch Car Service Perungudi", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Perungudi+Chennai" },
  { name: "Auto Doctor Perungudi", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Perungudi+Chennai" },
  { name: "Om Sakthi Motors", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Perungudi+Chennai" },
  { name: "Perfect Car Care", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Perungudi+Chennai" },
  { name: "Sri Ram Auto Work", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Work+Perungudi+Chennai" },

  // === Navalur – 600130 ===
  { name: "Navalur Auto Garage", area: "Sholinganallur", pincode: "600130", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Navalur+Auto+Garage+Chennai" },
  { name: "Victory Motors", area: "Sholinganallur", pincode: "600130", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Motors+Navalur+Chennai" },
  { name: "Sai Auto Garage", area: "Sholinganallur", pincode: "600130", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Navalur+Chennai" },
  { name: "Bosch Car Service Navalur", area: "Sholinganallur", pincode: "600130", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Navalur+Chennai" },
  { name: "Wheels Zone", area: "Sholinganallur", pincode: "600130", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Navalur+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Sholinganallur", pincode: "600130", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Navalur+Chennai" },
  { name: "Auto Doctor Navalur", area: "Sholinganallur", pincode: "600130", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Navalur+Chennai" },
  { name: "Perfect Car Care", area: "Sholinganallur", pincode: "600130", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Navalur+Chennai" },
  { name: "Om Sakthi Motors", area: "Sholinganallur", pincode: "600130", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Navalur+Chennai" },
  { name: "Sri Ram Auto Works", area: "Sholinganallur", pincode: "600130", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Works+Navalur+Chennai" },

  // === Thoraipakkam – 600097 ===
  { name: "OMR Auto Works", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=OMR+Auto+Works+Thoraipakkam+Chennai" },
  { name: "Bosch Car Service Thoraipakkam", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Thoraipakkam+Chennai" },
  { name: "Sai Auto Garage", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Thoraipakkam+Chennai" },
  { name: "Victory Auto Works", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Thoraipakkam+Chennai" },
  { name: "Wheels Zone Thoraipakkam", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Thoraipakkam+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Thoraipakkam", pincode: "600097", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Thoraipakkam+Chennai" },
  { name: "Auto Doctor Thoraipakkam", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Thoraipakkam+Chennai" },
  { name: "Om Sakthi Motors", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Thoraipakkam+Chennai" },
  { name: "Perfect Car Care", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Thoraipakkam+Chennai" },
  { name: "Sri Ram Auto Work", area: "Thoraipakkam", pincode: "600097", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Work+Thoraipakkam+Chennai" },

  // === Karapakkam – 600097 ===
  { name: "Karapakkam Auto Works", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Karapakkam+Auto+Works+Chennai" },
  { name: "Victory Motors", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Motors+Karapakkam+Chennai" },
  { name: "Sai Auto Garage", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Karapakkam+Chennai" },
  { name: "Wheels Zone Karapakkam", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Karapakkam+Chennai" },
  { name: "Bosch Car Service Karapakkam", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Karapakkam+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Sholinganallur", pincode: "600097", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Karapakkam+Chennai" },
  { name: "Auto Doctor Karapakkam", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Karapakkam+Chennai" },
  { name: "Om Sakthi Motors", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Karapakkam+Chennai" },
  { name: "Perfect Car Care", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Karapakkam+Chennai" },
  { name: "Sri Vignesh Auto Works", area: "Sholinganallur", pincode: "600097", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Vignesh+Auto+Works+Karapakkam+Chennai" },

  // === Potheri – 603203 ===
  { name: "Potheri Auto Works", area: "Tambaram", pincode: "603203", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Potheri+Auto+Works+Chennai" },
  { name: "Sai Auto Garage", area: "Tambaram", pincode: "603203", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Potheri+Chennai" },
  { name: "Victory Auto Works", area: "Tambaram", pincode: "603203", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Potheri+Chennai" },
  { name: "Wheels Zone", area: "Tambaram", pincode: "603203", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Potheri+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Tambaram", pincode: "603203", type: "Bike", rating: 4.1, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Potheri+Chennai" },
  { name: "Bosch Car Service Potheri", area: "Tambaram", pincode: "603203", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Potheri+Chennai" },
  { name: "Auto Doctor Potheri", area: "Tambaram", pincode: "603203", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Potheri+Chennai" },
  { name: "Perfect Motors", area: "Tambaram", pincode: "603203", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Motors+Potheri+Chennai" },
  { name: "Om Sakthi Motors", area: "Tambaram", pincode: "603203", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Potheri+Chennai" },
  { name: "Sri Ram Auto Works", area: "Tambaram", pincode: "603203", type: "Car", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Works+Potheri+Chennai" },

  // === Guduvanchery – 603202 ===
  { name: "Guduvanchery Auto Works", area: "Tambaram", pincode: "603202", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Guduvanchery+Auto+Works+Chennai" },
  { name: "Sai Auto Garage", area: "Tambaram", pincode: "603202", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Guduvanchery+Chennai" },
  { name: "Wheels Zone Guduvanchery", area: "Tambaram", pincode: "603202", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Guduvanchery+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Tambaram", pincode: "603202", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Guduvanchery+Chennai" },
  { name: "Victory Auto Works", area: "Tambaram", pincode: "603202", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Guduvanchery+Chennai" },
  { name: "Bosch Car Service Guduvanchery", area: "Tambaram", pincode: "603202", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Guduvanchery+Chennai" },
  { name: "Auto Doctor Guduvanchery", area: "Tambaram", pincode: "603202", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Guduvanchery+Chennai" },
  { name: "Perfect Car Care", area: "Tambaram", pincode: "603202", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Guduvanchery+Chennai" },
  { name: "Om Sakthi Motors", area: "Tambaram", pincode: "603202", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Guduvanchery+Chennai" },
  { name: "Sri Ram Auto Works", area: "Tambaram", pincode: "603202", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Works+Guduvanchery+Chennai" },

  // === Urapakkam – 603210 ===
  { name: "Urapakkam Auto Works", area: "Tambaram", pincode: "603210", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Urapakkam+Auto+Works+Chennai" },
  { name: "Sai Auto Garage", area: "Tambaram", pincode: "603210", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Urapakkam+Chennai" },
  { name: "Wheels Zone Urapakkam", area: "Tambaram", pincode: "603210", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Urapakkam+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Tambaram", pincode: "603210", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Urapakkam+Chennai" },
  { name: "Victory Auto Works", area: "Tambaram", pincode: "603210", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Urapakkam+Chennai" },
  { name: "Bosch Car Service Urapakkam", area: "Tambaram", pincode: "603210", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Urapakkam+Chennai" },
  { name: "Auto Doctor Urapakkam", area: "Tambaram", pincode: "603210", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Urapakkam+Chennai" },
  { name: "Perfect Car Care Urapakkam", area: "Tambaram", pincode: "603210", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Urapakkam+Chennai" },
  { name: "Om Sakthi Motors", area: "Tambaram", pincode: "603210", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Urapakkam+Chennai" },
  { name: "Sri Ram Auto Works", area: "Tambaram", pincode: "603210", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Works+Urapakkam+Chennai" },

  // === Perungalathur – 600063 ===
  { name: "Perungalathur Auto Works", area: "Tambaram", pincode: "600063", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Perungalathur+Auto+Works+Chennai" },
  { name: "Sai Auto Garage", area: "Tambaram", pincode: "600063", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Perungalathur+Chennai" },
  { name: "Victory Auto Works", area: "Tambaram", pincode: "600063", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Perungalathur+Chennai" },
  { name: "Wheels Zone", area: "Tambaram", pincode: "600063", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Perungalathur+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Tambaram", pincode: "600063", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Perungalathur+Chennai" },
  { name: "Bosch Car Service Perungalathur", area: "Tambaram", pincode: "600063", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Perungalathur+Chennai" },
  { name: "Auto Doctor Perungalathur", area: "Tambaram", pincode: "600063", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Perungalathur+Chennai" },
  { name: "Perfect Car Care", area: "Tambaram", pincode: "600063", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Perungalathur+Chennai" },
  { name: "Om Sakthi Motors", area: "Tambaram", pincode: "600063", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Perungalathur+Chennai" },
  { name: "Sri Ram Auto Works", area: "Tambaram", pincode: "600063", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Auto+Works+Perungalathur+Chennai" },

  // === Guindy – 600032 ===
  { name: "Guindy Auto Works", area: "Guindy", pincode: "600032", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Guindy+Auto+Works+Chennai" },
  { name: "Bosch Car Service Guindy", area: "Guindy", pincode: "600032", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Guindy+Chennai" },
  { name: "Sri Venkateswara Motors", area: "Guindy", pincode: "600032", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Venkateswara+Motors+Guindy+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Guindy", pincode: "600032", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Guindy+Chennai" },
  { name: "Sai Auto Garage", area: "Guindy", pincode: "600032", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Guindy+Chennai" },
  { name: "Perfect Car Care", area: "Guindy", pincode: "600032", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Guindy+Chennai" },
  { name: "Victory Auto Works", area: "Guindy", pincode: "600032", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Works+Guindy+Chennai" },
  { name: "Om Sai Motors", area: "Guindy", pincode: "600032", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sai+Motors+Guindy+Chennai" },
  { name: "Wheels Care", area: "Guindy", pincode: "600032", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Care+Guindy+Chennai" },
  { name: "Auto Doctor Guindy", area: "Guindy", pincode: "600032", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Guindy+Chennai" },
  { name: "Guindy Auto Care", area: "Guindy", pincode: "600032", type: "Car", rating: 4.4, phone: "+91 9840412301", maps_url: "https://maps.google.com/?q=Guindy+Auto+Care" },
  { name: "Elite Car Mechanics Guindy", area: "Guindy", pincode: "600032", type: "Car", rating: 4.2, phone: "+91 9840412302", maps_url: "https://maps.google.com/?q=Elite+Car+Mechanics+Guindy" },
  { name: "SpeedFix Garage", area: "Guindy", pincode: "600032", type: "Car", rating: 4.5, phone: "+91 9840412303", maps_url: "https://maps.google.com/?q=SpeedFix+Garage+Guindy" },
  { name: "Prime Auto Works", area: "Guindy", pincode: "600032", type: "Car", rating: 4.1, phone: "+91 9840412304", maps_url: "https://maps.google.com/?q=Prime+Auto+Works+Guindy" },
  { name: "Metro Car Service", area: "Guindy", pincode: "600032", type: "Car", rating: 4.3, phone: "+91 9840412305", maps_url: "https://maps.google.com/?q=Metro+Car+Service+Guindy" },
  { name: "TurboTech Mechanics", area: "Guindy", pincode: "600032", type: "Car", rating: 4.6, phone: "+91 9840412306", maps_url: "https://maps.google.com/?q=TurboTech+Mechanics+Guindy" },
  { name: "Green Auto Garage", area: "Guindy", pincode: "600032", type: "Car", rating: 4.0, phone: "+91 9840412307", maps_url: "https://maps.google.com/?q=Green+Auto+Garage+Guindy" },
  { name: "FastLane Service Center", area: "Guindy", pincode: "600032", type: "Car", rating: 4.2, phone: "+91 9840412308", maps_url: "https://maps.google.com/?q=FastLane+Service+Center+Guindy" },
  { name: "Reliable Car Mechanics", area: "Guindy", pincode: "600032", type: "Car", rating: 4.4, phone: "+91 9840412309", maps_url: "https://maps.google.com/?q=Reliable+Car+Mechanics+Guindy" },
  { name: "Star Auto Garage", area: "Guindy", pincode: "600032", type: "Car", rating: 4.3, phone: "+91 9840412310", maps_url: "https://maps.google.com/?q=Star+Auto+Garage+Guindy" },

  // === Mylapore – 600004 ===
  { name: "Mylapore Auto Works", area: "Mylapore", pincode: "600004", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Mylapore+Auto+Works+Chennai" },
  { name: "Bosch Car Service Mylapore", area: "Mylapore", pincode: "600004", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Mylapore+Chennai" },
  { name: "Sri Balaji Motors", area: "Mylapore", pincode: "600004", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Balaji+Motors+Mylapore+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Mylapore", pincode: "600004", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Mylapore+Chennai" },
  { name: "Sai Car Care", area: "Mylapore", pincode: "600004", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Car+Care+Mylapore+Chennai" },
  { name: "Perfect Motors", area: "Mylapore", pincode: "600004", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Motors+Mylapore+Chennai" },
  { name: "Victory Auto Garage", area: "Mylapore", pincode: "600004", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Auto+Garage+Mylapore+Chennai" },
  { name: "Om Sakthi Motors", area: "Mylapore", pincode: "600004", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sakthi+Motors+Mylapore+Chennai" },
  { name: "Wheels Zone", area: "Mylapore", pincode: "600004", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Zone+Mylapore+Chennai" },
  { name: "Auto Doctor", area: "Mylapore", pincode: "600004", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Mylapore+Chennai" },

  // === Nungambakkam – 600034 ===
  { name: "Nungambakkam Auto Works", area: "Nungambakkam", pincode: "600034", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Nungambakkam+Auto+Works+Chennai" },
  { name: "Bosch Car Service Nungambakkam", area: "Nungambakkam", pincode: "600034", type: "Car", rating: 4.7, maps_url: "https://www.google.com/maps/search/?api=1&query=Bosch+Car+Service+Nungambakkam+Chennai" },
  { name: "Sri Ram Motors", area: "Nungambakkam", pincode: "600034", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Sri+Ram+Motors+Nungambakkam+Chennai" },
  { name: "Royal Enfield Service Centre", area: "Nungambakkam", pincode: "600034", type: "Bike", rating: 4.2, maps_url: "https://www.google.com/maps/search/?api=1&query=Royal+Enfield+Service+Centre+Nungambakkam+Chennai" },
  { name: "Sai Auto Garage", area: "Nungambakkam", pincode: "600034", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Sai+Auto+Garage+Nungambakkam+Chennai" },
  { name: "Perfect Car Care", area: "Nungambakkam", pincode: "600034", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Perfect+Car+Care+Nungambakkam+Chennai" },
  { name: "Victory Motors", area: "Nungambakkam", pincode: "600034", type: "Car", rating: 4.6, maps_url: "https://www.google.com/maps/search/?api=1&query=Victory+Motors+Nungambakkam+Chennai" },
  { name: "Om Sai Auto Works", area: "Nungambakkam", pincode: "600034", type: "Car", rating: 4.3, maps_url: "https://www.google.com/maps/search/?api=1&query=Om+Sai+Auto+Works+Nungambakkam+Chennai" },
  { name: "Wheels Care", area: "Nungambakkam", pincode: "600034", type: "Car", rating: 4.5, maps_url: "https://www.google.com/maps/search/?api=1&query=Wheels+Care+Nungambakkam+Chennai" },
  { name: "Auto Doctor Nungambakkam", area: "Nungambakkam", pincode: "600034", type: "Car", rating: 4.4, maps_url: "https://www.google.com/maps/search/?api=1&query=Auto+Doctor+Nungambakkam+Chennai" },

  // === Kodambakkam – 600024 ===
  { name: "Kodambakkam Car Care", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.5, phone: "+91 9840412311", maps_url: "https://maps.google.com/?q=Kodambakkam+Car+Care" },
  { name: "Elite Motor Works", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.3, phone: "+91 9840412312", maps_url: "https://maps.google.com/?q=Elite+Motor+Works+Kodambakkam" },
  { name: "SmartFix Garage", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.1, phone: "+91 9840412313", maps_url: "https://maps.google.com/?q=SmartFix+Garage+Kodambakkam" },
  { name: "QuickDrive Mechanics", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.4, phone: "+91 9840412314", maps_url: "https://maps.google.com/?q=QuickDrive+Mechanics+Kodambakkam" },
  { name: "AutoPro Service Hub", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.2, phone: "+91 9840412315", maps_url: "https://maps.google.com/?q=AutoPro+Service+Hub+Kodambakkam" },
  { name: "SpeedMaster Garage", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.0, phone: "+91 9840412316", maps_url: "https://maps.google.com/?q=SpeedMaster+Garage+Kodambakkam" },
  { name: "Urban Car Mechanics", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.3, phone: "+91 9840412317", maps_url: "https://maps.google.com/?q=Urban+Car+Mechanics+Kodambakkam" },
  { name: "Precision Auto Works", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.4, phone: "+91 9840412318", maps_url: "https://maps.google.com/?q=Precision+Auto+Works+Kodambakkam" },
  { name: "MetroFix Garage", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.1, phone: "+91 9840412319", maps_url: "https://maps.google.com/?q=MetroFix+Garage+Kodambakkam" },
  { name: "Royal Auto Care", area: "Kodambakkam", pincode: "600024", type: "Car", rating: 4.5, phone: "+91 9840412320", maps_url: "https://maps.google.com/?q=Royal+Auto+Care+Kodambakkam" },

  // === Vadapalani – 600026 ===
  { name: "Vadapalani Auto Service", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.2, phone: "+91 9840412321", maps_url: "https://maps.google.com/?q=Vadapalani+Auto+Service" },
  { name: "TurboFix Garage", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.4, phone: "+91 9840412322", maps_url: "https://maps.google.com/?q=TurboFix+Garage+Vadapalani" },
  { name: "Starline Car Care", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.1, phone: "+91 9840412323", maps_url: "https://maps.google.com/?q=Starline+Car+Care+Vadapalani" },
  { name: "Urban Auto Works", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.3, phone: "+91 9840412324", maps_url: "https://maps.google.com/?q=Urban+Auto+Works+Vadapalani" },
  { name: "SpeedPro Mechanics", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.5, phone: "+91 9840412325", maps_url: "https://maps.google.com/?q=SpeedPro+Mechanics+Vadapalani" },
  { name: "PrimeFix Garage", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.0, phone: "+91 9840412326", maps_url: "https://maps.google.com/?q=PrimeFix+Garage+Vadapalani" },
  { name: "CityDrive Service Center", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.3, phone: "+91 9840412327", maps_url: "https://maps.google.com/?q=CityDrive+Service+Center+Vadapalani" },
  { name: "Apex Auto Mechanics", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.4, phone: "+91 9840412328", maps_url: "https://maps.google.com/?q=Apex+Auto+Mechanics+Vadapalani" },
  { name: "MetroPro Garage", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.2, phone: "+91 9840412329", maps_url: "https://maps.google.com/?q=MetroPro+Garage+Vadapalani" },
  { name: "Reliable Auto Care", area: "Vadapalani", pincode: "600026", type: "Car", rating: 4.1, phone: "+91 9840412330", maps_url: "https://maps.google.com/?q=Reliable+Auto+Care+Vadapalani" },

  // === Perambur – 600011 ===
  { name: "Perambur Auto Garage", area: "Perambur", pincode: "600011", type: "Car", rating: 4.2, phone: "+91 9840412351", maps_url: "https://maps.google.com/?q=Perambur+Auto+Garage" },
  { name: "SpeedFix Perambur", area: "Perambur", pincode: "600011", type: "Car", rating: 4.4, phone: "+91 9840412352", maps_url: "https://maps.google.com/?q=SpeedFix+Perambur" },
  { name: "Metro Car Mechanics", area: "Perambur", pincode: "600011", type: "Car", rating: 4.1, phone: "+91 9840412353", maps_url: "https://maps.google.com/?q=Metro+Car+Mechanics+Perambur" },
  { name: "Apex Auto Works", area: "Perambur", pincode: "600011", type: "Car", rating: 4.3, phone: "+91 9840412354", maps_url: "https://maps.google.com/?q=Apex+Auto+Works+Perambur" },
  { name: "PrimeDrive Service Center", area: "Perambur", pincode: "600011", type: "Car", rating: 4.5, phone: "+91 9840412355", maps_url: "https://maps.google.com/?q=PrimeDrive+Service+Center+Perambur" },
  { name: "GreenLine Garage", area: "Perambur", pincode: "600011", type: "Car", rating: 4.0, phone: "+91 9840412356", maps_url: "https://maps.google.com/?q=GreenLine+Garage+Perambur" },
  { name: "Reliable Mechanics Hub", area: "Perambur", pincode: "600011", type: "Car", rating: 4.3, phone: "+91 9840412357", maps_url: "https://maps.google.com/?q=Reliable+Mechanics+Hub+Perambur" },
  { name: "TurboDrive Auto Care", area: "Perambur", pincode: "600011", type: "Car", rating: 4.4, phone: "+91 9840412358", maps_url: "https://maps.google.com/?q=TurboDrive+Auto+Care+Perambur" },
  { name: "StarFix Garage", area: "Perambur", pincode: "600011", type: "Car", rating: 4.2, phone: "+91 9840412359", maps_url: "https://maps.google.com/?q=StarFix+Garage+Perambur" },
  { name: "CityPro Auto Mechanics", area: "Perambur", pincode: "600011", type: "Car", rating: 4.3, phone: "+91 9840412360", maps_url: "https://maps.google.com/?q=CityPro+Auto+Mechanics+Perambur" },

  // === Pallavaram – 600043 ===
  { name: "Pallavaram Auto Care", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.4, phone: "+91 9840412361", maps_url: "https://maps.google.com/?q=Pallavaram+Auto+Care" },
  { name: "RapidFix Mechanics", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.2, phone: "+91 9840412362", maps_url: "https://maps.google.com/?q=RapidFix+Mechanics+Pallavaram" },
  { name: "EliteDrive Garage", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.5, phone: "+91 9840412363", maps_url: "https://maps.google.com/?q=EliteDrive+Garage+Pallavaram" },
  { name: "ApexSpeed Car Service", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.3, phone: "+91 9840412364", maps_url: "https://maps.google.com/?q=ApexSpeed+Car+Service+Pallavaram" },
  { name: "PrimeTech Auto Works", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.1, phone: "+91 9840412365", maps_url: "https://maps.google.com/?q=PrimeTech+Auto+Works+Pallavaram" },
  { name: "MetroFix Service Center", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.3, phone: "+91 9840412366", maps_url: "https://maps.google.com/?q=MetroFix+Service+Center+Pallavaram" },
  { name: "SmartDrive Garage", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.4, phone: "+91 9840412367", maps_url: "https://maps.google.com/?q=SmartDrive+Garage+Pallavaram" },
  { name: "Urban Car Mechanics", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.2, phone: "+91 9840412368", maps_url: "https://maps.google.com/?q=Urban+Car+Mechanics+Pallavaram" },
  { name: "ReliableDrive Service", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.3, phone: "+91 9840412369", maps_url: "https://maps.google.com/?q=ReliableDrive+Service+Pallavaram" },
  { name: "FastLane Auto Garage", area: "Pallavaram", pincode: "600043", type: "Car", rating: 4.5, phone: "+91 9840412370", maps_url: "https://maps.google.com/?q=FastLane+Auto+Garage+Pallavaram" },

  // === Kolathur – 600099 ===
  { name: "Kolathur Car Service", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.3, phone: "+91 9840412371", maps_url: "https://maps.google.com/?q=Kolathur+Car+Service" },
  { name: "ApexFix Garage", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.2, phone: "+91 9840412372", maps_url: "https://maps.google.com/?q=ApexFix+Garage+Kolathur" },
  { name: "TurboLine Mechanics", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.4, phone: "+91 9840412373", maps_url: "https://maps.google.com/?q=TurboLine+Mechanics+Kolathur" },
  { name: "Elite Auto Hub", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.1, phone: "+91 9840412374", maps_url: "https://maps.google.com/?q=Elite+Auto+Hub+Kolathur" },
  { name: "PrimeSpeed Garage", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.5, phone: "+91 9840412375", maps_url: "https://maps.google.com/?q=PrimeSpeed+Garage+Kolathur" },
  { name: "CityDrive Mechanics", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.3, phone: "+91 9840412376", maps_url: "https://maps.google.com/?q=CityDrive+Mechanics+Kolathur" },
  { name: "Reliable Auto Works", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.2, phone: "+91 9840412377", maps_url: "https://maps.google.com/?q=Reliable+Auto+Works+Kolathur" },
  { name: "SpeedTech Garage", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.4, phone: "+91 9840412378", maps_url: "https://maps.google.com/?q=SpeedTech+Garage+Kolathur" },
  { name: "MetroDrive Service Center", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.1, phone: "+91 9840412379", maps_url: "https://maps.google.com/?q=MetroDrive+Service+Center+Kolathur" },
  { name: "GreenLine Auto Garage", area: "Villivakkam", pincode: "600099", type: "Car", rating: 4.3, phone: "+91 9840412380", maps_url: "https://maps.google.com/?q=GreenLine+Auto+Garage+Kolathur" },

  // === Thiruvanmiyur – 600041 ===
  { name: "Thiruvanmiyur Car Care", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.5, phone: "+91 9840412381", maps_url: "https://maps.google.com/?q=Thiruvanmiyur+Car+Care" },
  { name: "BeachSide Auto Garage", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.4, phone: "+91 9840412382", maps_url: "https://maps.google.com/?q=BeachSide+Auto+Garage+Thiruvanmiyur" },
  { name: "ApexDrive Mechanics", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.3, phone: "+91 9840412383", maps_url: "https://maps.google.com/?q=ApexDrive+Mechanics+Thiruvanmiyur" },
  { name: "SpeedLine Car Service", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.2, phone: "+91 9840412384", maps_url: "https://maps.google.com/?q=SpeedLine+Car+Service+Thiruvanmiyur" },
  { name: "EliteTech Auto Works", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.6, phone: "+91 9840412385", maps_url: "https://maps.google.com/?q=EliteTech+Auto+Works+Thiruvanmiyur" },
  { name: "MetroFix Mechanics", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.3, phone: "+91 9840412386", maps_url: "https://maps.google.com/?q=MetroFix+Mechanics+Thiruvanmiyur" },
  { name: "RapidDrive Garage", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.4, phone: "+91 9840412387", maps_url: "https://maps.google.com/?q=RapidDrive+Garage+Thiruvanmiyur" },
  { name: "Prime Auto Care", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.1, phone: "+91 9840412388", maps_url: "https://maps.google.com/?q=Prime+Auto+Care+Thiruvanmiyur" },
  { name: "SmartSpeed Garage", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.3, phone: "+91 9840412389", maps_url: "https://maps.google.com/?q=SmartSpeed+Garage+Thiruvanmiyur" },
  { name: "ReliableDrive Mechanics", area: "Thiruvanmiyur", pincode: "600041", type: "Car", rating: 4.5, phone: "+91 9840412390", maps_url: "https://maps.google.com/?q=ReliableDrive+Mechanics+Thiruvanmiyur" },

  // === Besant Nagar – 600090 ===
  { name: "Besant Nagar Auto Care", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.4, phone: "+91 9840412391", maps_url: "https://maps.google.com/?q=Besant+Nagar+Auto+Care" },
  { name: "BeachDrive Garage", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.3, phone: "+91 9840412392", maps_url: "https://maps.google.com/?q=BeachDrive+Garage+Besant+Nagar" },
  { name: "Apex Auto Mechanics", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.5, phone: "+91 9840412393", maps_url: "https://maps.google.com/?q=Apex+Auto+Mechanics+Besant+Nagar" },
  { name: "PrimeLine Car Service", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.2, phone: "+91 9840412394", maps_url: "https://maps.google.com/?q=PrimeLine+Car+Service+Besant+Nagar" },
  { name: "SpeedTech Garage", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.3, phone: "+91 9840412395", maps_url: "https://maps.google.com/?q=SpeedTech+Garage+Besant+Nagar" },
  { name: "EliteDrive Mechanics", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.6, phone: "+91 9840412396", maps_url: "https://maps.google.com/?q=EliteDrive+Mechanics+Besant+Nagar" },
  { name: "RapidFix Auto Hub", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.1, phone: "+91 9840412397", maps_url: "https://maps.google.com/?q=RapidFix+Auto+Hub+Besant+Nagar" },
  { name: "UrbanDrive Garage", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.4, phone: "+91 9840412398", maps_url: "https://maps.google.com/?q=UrbanDrive+Garage+Besant+Nagar" },
  { name: "MetroCar Mechanics", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.2, phone: "+91 9840412399", maps_url: "https://maps.google.com/?q=MetroCar+Mechanics+Besant+Nagar" },
  { name: "StarDrive Auto Works", area: "Besant Nagar", pincode: "600090", type: "Car", rating: 4.5, phone: "+91 9840412400", maps_url: "https://maps.google.com/?q=StarDrive+Auto+Works+Besant+Nagar" },

  // === Additional Perungudi (format 2) ===
  { name: "TechDrive Garage", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.5, phone: "+91 9840412332", maps_url: "https://maps.google.com/?q=TechDrive+Garage+Perungudi" },
  { name: "Smart Auto Mechanics", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.2, phone: "+91 9840412333", maps_url: "https://maps.google.com/?q=Smart+Auto+Mechanics+Perungudi" },
  { name: "FastTrack Car Service", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.3, phone: "+91 9840412334", maps_url: "https://maps.google.com/?q=FastTrack+Car+Service+Perungudi" },
  { name: "Apex Car Garage", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.1, phone: "+91 9840412335", maps_url: "https://maps.google.com/?q=Apex+Car+Garage+Perungudi" },
  { name: "EliteDrive Service Hub", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.6, phone: "+91 9840412336", maps_url: "https://maps.google.com/?q=EliteDrive+Service+Hub+Perungudi" },
  { name: "MetroSpeed Mechanics", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.3, phone: "+91 9840412337", maps_url: "https://maps.google.com/?q=MetroSpeed+Mechanics+Perungudi" },
  { name: "GreenTech Garage", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.0, phone: "+91 9840412338", maps_url: "https://maps.google.com/?q=GreenTech+Garage+Perungudi" },
  { name: "PrimeCare Auto Service", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.4, phone: "+91 9840412339", maps_url: "https://maps.google.com/?q=PrimeCare+Auto+Service+Perungudi" },
  { name: "RapidFix Mechanics", area: "Perungudi", pincode: "600096", type: "Car", rating: 4.2, phone: "+91 9840412340", maps_url: "https://maps.google.com/?q=RapidFix+Mechanics+Perungudi" },

  // === Additional Sholinganallur (format 2) ===
  { name: "Sholinganallur Car Care", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.5, phone: "+91 9840412341", maps_url: "https://maps.google.com/?q=Sholinganallur+Car+Care" },
  { name: "OceanDrive Garage", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.2, phone: "+91 9840412342", maps_url: "https://maps.google.com/?q=OceanDrive+Garage+Sholinganallur" },
  { name: "SpeedLine Mechanics", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.3, phone: "+91 9840412343", maps_url: "https://maps.google.com/?q=SpeedLine+Mechanics+Sholinganallur" },
  { name: "Elite Auto Service", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.4, phone: "+91 9840412344", maps_url: "https://maps.google.com/?q=Elite+Auto+Service+Sholinganallur" },
  { name: "TechFix Car Garage", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.1, phone: "+91 9840412345", maps_url: "https://maps.google.com/?q=TechFix+Car+Garage+Sholinganallur" },
  { name: "RapidDrive Mechanics", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.3, phone: "+91 9840412346", maps_url: "https://maps.google.com/?q=RapidDrive+Mechanics+Sholinganallur" },
  { name: "Urban Auto Garage", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.2, phone: "+91 9840412347", maps_url: "https://maps.google.com/?q=Urban+Auto+Garage+Sholinganallur" },
  { name: "ApexSpeed Service", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.5, phone: "+91 9840412348", maps_url: "https://maps.google.com/?q=ApexSpeed+Service+Sholinganallur" },
  { name: "Reliable Drive Works", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.4, phone: "+91 9840412349", maps_url: "https://maps.google.com/?q=Reliable+Drive+Works+Sholinganallur" },
  { name: "TurboDrive Garage", area: "Sholinganallur", pincode: "600119", type: "Car", rating: 4.3, phone: "+91 9840412350", maps_url: "https://maps.google.com/?q=TurboDrive+Garage+Sholinganallur" },
];

// Get unique areas from garage listings
export const garageAreas = [...new Set(garageListings.map(g => g.area))].sort();

// Get unique pincodes from garage listings
export const garagePincodes = [...new Set(garageListings.map(g => g.pincode))].sort();
