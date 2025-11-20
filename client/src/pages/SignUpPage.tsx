import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon } from "lucide-react";
import { Link } from "react-router";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = (e:any) => {
    e.preventDefault();
    signup(formData);
  };

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-900">
      <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row">
            {/* FORM CLOUMN - LEFT SIDE */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30">
              <div className="w-full max-w-md">
                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                  <MessageCircleIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h2 className="text-2xl font-bold text-slate-200 mb-2">Kayıt ol</h2>
                  <p className="text-slate-400">Yeni hesap oluşturmak için kaydol</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* FULL NAME */}
                  <div>
                    <label className="auth-input-label">Ad Soyad</label>
                    <div className="relative">
                      <UserIcon className="auth-input-icon" />

                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="input"
                        placeholder="Mustafa Yılmaz"
                      />
                    </div>
                  </div>

                  {/* EMAIL INPUT */}
                  <div>
                    <label className="auth-input-label">Email</label>
                    <div className="relative">
                      <MailIcon className="auth-input-icon" />

                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                        placeholder="birisi@gmail.com"
                      />
                    </div>
                  </div>

                  {/* PASSWORD INPUT */}
                  <div>
                    <label className="auth-input-label">Şifre</label>
                    <div className="relative">
                      <LockIcon className="auth-input-icon" />

                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input"
                        placeholder="Şifrenizi girin"
                      />
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button className="auth-btn" type="submit" disabled={isSigningUp}>
                    {isSigningUp ? (
                      <LoaderIcon className="w-full h-5 animate-spin text-center" />
                    ) : (
                      "Hesap oluştur"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/login" className="auth-link">
                    Zaten hesabın var mı? Giriş Yap
                  </Link>
                </div>
              </div>
            </div>

            {/* FORM ILLUSTRATION - RIGHT SIDE */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">
              <div>
                <img
                  src="/signup.png"
                  alt="People using mobile devices"
                  className="w-full h-auto object-contain"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-medium text-cyan-400">Kullanmaya Başla</h3>

                  <div className="mt-4 flex justify-center gap-4">
                    <span className="auth-badge">Bedava</span>
                    <span className="auth-badge">Kolay Kurulum</span>
                    <span className="auth-badge">Özel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}
export default SignUpPage;