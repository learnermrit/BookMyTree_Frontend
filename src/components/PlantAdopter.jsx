import { Link } from 'react-router-dom';

const PlantAdopter = () => {
  return (
    <Link to="/plant-adoption" className="group block w-full overflow-hidden rounded-lg bg-white shadow-lg transition hover:shadow-xl">
      <div className="flex items-start">
      <div className="my-8 px-4 w-1/2">
        <h2 className="text-2xl font-bold mb-4">Plant Adopter</h2>

        <p className="mb-4">
          Connect with farmers through our app for <span className="text-green-500 font-bold">plant adoption</span>. Users <span className="text-green-500 font-bold">financially support</span> farmers, creating a <span className="text-green-500 font-bold">real impact</span>. Adopters enjoy <span className="text-green-500 font-bold">exclusive fruit experiences</span> and earn <span className="text-green-500 font-bold">Green Points</span> in their virtual garden.
        </p>

        <p className="mb-4">
          Our app bridges the gap between users willing to give back to the Earth and farmers lacking <span className="text-green-500 font-bold">financial resources</span>. By facilitating <span className="text-green-500 font-bold">tree and plant adoptions</span>, we create a <span className="text-green-500 font-bold">sustainable future</span>.
        </p>

        <p className="mb-4">
          Adopters directly contribute to the <span className="text-green-500 font-bold">growth</span> of their adopted plant, supporting <span className="text-green-500 font-bold">nearby farmers</span>. <span className="text-green-500 font-bold">Fruit plant adopters</span> receive <span className="text-green-500 font-bold">special invitations</span> to witness the <span className="text-green-500 font-bold">fruits</span> of their plants, creating a <span className="text-green-500 font-bold">unique and fulfilling experience</span>.
        </p>

        <p>
          Join <span className="text-green-500 font-bold">Adopt of Plants and Crops</span> to make a <span className="text-green-500 font-bold">positive difference</span> in our environment and experience the joy of <span className="text-green-500 font-bold">contributing</span> to the <span className="text-green-500 font-bold">growth</span> of our beautiful planet.
        </p>

        <span className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-emerald-700">
          Adopt plants now
        </span>
      </div>
      <div className="w-1/2 p-2 flex">
        <div className="overflow-hidden rounded-lg">
          <img
            src="https://plus.unsplash.com/premium_photo-1663091116913-9e49bdb5c69b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Plant adoption"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      </div>
    </Link>
  );
};

export default PlantAdopter;