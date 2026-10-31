import { Link } from 'react-router-dom';

function BookMyTree() {
  return (
    <div className="w-full py-8">
      <div className="w-full flex items-start shadow-lg rounded-3xl overflow-hidden border border-green-100 bg-white">
        <div className="p-2 w-1/2 flex">
          <div className='w-1/2 rounded-l-2xl overflow-hidden'>
            <img
              src="https://images.pexels.com/photos/5528993/pexels-photo-5528993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              alt="Orchard tree"
              className="w-full h-full object-cover"
            />
          </div>
          <div className='w-1/2 rounded-r-2xl overflow-hidden'>
            <img
              src="https://cdn.pixabay.com/photo/2016/01/02/02/03/oranges-1117644_1280.jpg"
              alt="Citrus fruit harvest"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="p-6 w-1/2 self-baseline">
          <h1 className="text-4xl font-bold mb-4 text-stone-900">Book My Tree</h1>
          <div className="my-8 px-4">
            <h2 className="text-3xl font-bold mb-6 text-green-700">BookMyTree: Harvest Joy with a Click</h2>

            <p className="mb-4 text-lg text-stone-700">
              Discover the magic of <span className="text-green-600 font-bold">BookMyTree</span>, where you can reserve a tree near your location during the enchanting fruit seasons. It's not just a booking; it's an invitation to experience the joy of nature with your family.
            </p>

            <p className="mb-4 text-lg text-stone-700">
              But that's not all – <span className="text-green-600 font-bold">BookMyTree</span> goes beyond personal enjoyment. Any surplus fruits can be donated to local farmers, contributing to their livelihood and fostering community connections. Additionally, you have the option to parcel the extra fruits, spreading the joy to your loved ones.
            </p>

            <p className="mb-4 text-lg text-stone-700">
              By booking a tree, you play a crucial role in <span className="text-green-600 font-bold">supporting farmers</span> directly. It's a unique initiative that not only brings joy to your doorstep but also nurtures the roots of our communities.
            </p>

            <p className="text-lg text-stone-700 mb-6">
              Experience the richness of nature, contribute to local farming, and make every fruit season memorable with <span className="text-green-600 font-bold">BookMyTree</span>.
            </p>

            <Link
              to="/tree-booking"
              className="inline-flex items-center justify-center rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
            >
              Inspect & Book Tree
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookMyTree