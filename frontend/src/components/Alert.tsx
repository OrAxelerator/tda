import "./alert.css";

export default function Alert({ msg, setAlertMsg }) {

    if (msg == "") {
        return null;
    }else {
        
        return (
          <div className="alert">
            {msg}
      
            <div className="meter">
              <span>
                <span className="progress"></span>
              </span>
            </div>
          </div>
        );
    }
}
