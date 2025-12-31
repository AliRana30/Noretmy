import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useState } from "react";

const New = ({ inputs, title }) => {
  const [file, setFile] = useState("");

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-600">{title}</h1>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex justify-center items-center">
            <img
              src={
                file
                  ? URL.createObjectURL(file)
                  : "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg"
              }
              alt="Preview"
              className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
            />
          </div>
          <div className="flex-[2]">
            <form className="flex flex-wrap gap-8 justify-between">
              <div className="w-full md:w-[48%]">
                <label htmlFor="file" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 cursor-pointer">
                  Image: <DriveFolderUploadOutlinedIcon className="text-amber-500 cursor-pointer" />
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {inputs.map((input) => (
                <div className="w-full md:w-[48%] space-y-2" key={input.id}>
                  <label className="block text-sm font-semibold text-gray-700">{input.label}</label>
                  <input 
                    type={input.type} 
                    placeholder={input.placeholder}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-0 focus:border-amber-500 hover:border-gray-300"
                  />
                </div>
              ))}
              <button 
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors mt-4"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default New;
