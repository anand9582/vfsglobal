import { useRef } from "react";

export default function LoginForm(){
    const formRef=useRef();        
    const serverUrl="http://192.168.10.111:8080/BioAs_MT_VER3.1";
    const handleSubmit=(event)=>{
        event.preventDefault();
        const loginUrl=serverUrl+"/Login.do?operation=doLogin";
        formRef.current.action=loginUrl;
        formRef.current.submit();
    }
    
    return (<div className="popup">
        <div className="block-popup">
          <div className="popup-title-wrap">
            <div className="popup-title">Login</div>
            <div className="popup-decor-top"></div>
          </div>
          <form name="frmLogin" method="POST" ref={formRef} onSubmit={handleSubmit}>
            <div className="popup-form">
              <div className="box-field">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Company Code"
                  autoComplete="off"
                  name="txtCmpCd"
                  required
                />
              </div>
              <div className="box-field">
                <input
                  type="text"
                  className="form-control"
                  placeholder="User Name"
                  autoComplete="off"
                  name="txtLoginId"
                  required
                />
              </div>
              <div className="box-field">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  autoComplete="off"
                  name="txtPassword"
                  required
                />
              </div>
              <div className="box-fileds_2">
                <div className="box-filed box-filed_btn m-auto">
                  <button type="submit" className="btn" value="login">
                    Login
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="popup-decor"></div>
      </div>)
}