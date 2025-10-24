import './barloader.css';
import { MoonLoader, BeatLoader, BarLoader } from "react-spinners";

 const Loader = ({isloading}) => {
    return(
        <>
        <div className='barloader-container'>
            <BarLoader color='rgba(0, 162, 255, 0.57)' width={'750'} loading={isloading}/>
        </div>
        </>
    )
 }
 export default Loader;