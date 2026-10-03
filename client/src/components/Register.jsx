 
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Register = () => { 
  const NavigateTo = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleRegister = async (data) => {
    data.phone = `+91${data.phone}`;
    await axios
      .post("http://localhost:4000/api/v1/user/register", data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        toast.success(res.data.message);
        NavigateTo(`/otp-verification/${data.phone}/${data.email}`);
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Registration failed");
      });
  };

  return (
    <>
      <div>
        <form
          className="auth-form"
          onSubmit={handleSubmit((data) => {
            handleRegister(data);
          })}
        >
          <h2>Register</h2>
          <input
            type="text"
            placeholder="Name"
            required
            {...register("name")}
          />
          <input
            type="email"
            placeholder="Email"
            required
            {...register("email")}
          />
          <div>
            <span>+91</span>
            <input
              type="number"
              placeholder="Phone"
              required
              {...register("phone")}
            />
          </div>
          <input
            type="password"
            placeholder="Password"
            required
            {...register("password")}
          />
          <div className="verification-method">
            <p>Select verification method</p>
            <div className="wrapper">
              <label>
                <input
                  type="radio"
                  name="verificationMethod"
                  value={"email"}
                  {...register("verificationMethod")}
                  required
                />
                email 
              </label>
              <label>
                <input
                  type="radio"
                  name="verificationMethod"
                  value={"phone"}
                  {...register("verificationMethod")}
                  required
                />
                Phone
              </label>
            </div>
          </div>
          <button type="submit">Register</button>
        </form>
      </div>
    </>
  );
};

export default Register;
