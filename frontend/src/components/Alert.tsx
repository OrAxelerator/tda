import "./alert.css";

type AlertProps = {
  msg: string;
};

export default function Alert({ msg }: AlertProps) {

    if (msg === "") {
        return null;
    } else {
        
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
