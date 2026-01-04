import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useState } from "react";
import axios from "axios";
import { API_CONFIG, getAuthHeaders } from "../../config/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
  return {
    isValid: errors.length === 0,
    errors
  };
};

const New = ({ inputs, title, apiEndpoint }) => {
  const [file, setFile] = useState("");
  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Check if endpoint is provided
    if (!apiEndpoint) {
      toast.error("API endpoint not configured for this action");
      setLoading(false);
      return;
    }

    try {
      let newUser = { ...info };

      // Handle file upload if exists (assuming backend handles it or we upload to Cloudinary first)
      if (file) {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "upload"); // Replace with your cloudinary preset
        try {
          const uploadRes = await axios.post(
            "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
            data
          );
          const { url } = uploadRes.data;
          newUser.img = url;
        } catch (err) {
            console.log("Image upload failed, continuing without image");
        }
      }

      // If we are creating a user, make sure required fields are present
      if (apiEndpoint.includes('auth/signup')) {
          newUser = {
              ...newUser,
              isSeller: newUser.isSeller !== undefined ? (newUser.isSeller === "true") : false,
          };
      }

      await axios.post(`${API_CONFIG.BASE_URL}${apiEndpoint}`, newUser, {
          headers: getAuthHeaders()
      });
      
      toast.success("Successfully created!");
      navigate(-1); // Go back
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Something went wrong!");
    } finally {
        setLoading(false);
    }
  };

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
                  {input.type === "select" ? (
                    <select
                      name={input.name}
                      onChange={handleChange}
                      className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-0 focus:border-amber-500 hover:border-gray-300"
                    >
                      {input.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input 
                        onChange={handleChange}
                        type={input.type} 
                        name={input.name}
                        placeholder={input.placeholder}
                        className={`w-full h-11 px-4 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-0 focus:border-amber-500 hover:border-gray-300 ${
                          input.type === 'password' && info[input.name] && !validatePassword(info[input.name]).isValid ? 'border-red-300' : ''
                        }`}
                      />
                      {input.type === 'password' && info[input.name] && (
                        <div className="mt-2 text-xs space-y-1">
                          {validatePassword(info[input.name]).errors.map((err, i) => (
                            <p key={i} className="text-red-500 flex items-center gap-1">
                              • {err}
                            </p>
                          ))}
                          {validatePassword(info[input.name]).isValid && (
                            <p className="text-green-600 flex items-center gap-1">
                              ✓ Password meets all requirements
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              <button 
                onClick={handleClick}
                type="submit"
                disabled={loading || (inputs.some(input => input.type === 'password' && info[input.name] && !validatePassword(info[input.name]).isValid))}
                className="w-full md:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors mt-4 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default New;
