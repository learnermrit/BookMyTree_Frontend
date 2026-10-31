import TopCard from '../components/TopCard';
import KisaanServices from '../components/KisaanServices';
import Pethiya from '../components/Pethiya';
import PlantAdopter from '../components/PlantAdopter';
import BookMyTree from '../components/BookMyTree';
import CropSuggestion from '../components/CropSuggestion';

export default function Home() {
  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Hero / Top Banner */}
      <TopCard />

      {/* Farmer / Kisaan Services Section */}
      <KisaanServices />

      {/* Pethiya Marketplace / Bazaar */}
      <Pethiya />

      {/* Plant Adopter Section */}
      <PlantAdopter />

      {/* Book My Tree Core Feature */}
      <BookMyTree />

      {/* AI Crop Suggestion Tool */}
      <CropSuggestion />
    </div>
  );
}