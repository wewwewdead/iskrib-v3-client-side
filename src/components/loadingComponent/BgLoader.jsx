import './bgloader.css';

 const Loader = ({isloading}) => {
    return(
        <>
        <div className="homepage-loading-container">
            <svg
                width="200px"
                height="200px"
                viewBox="0 0 360 100"
                xmlns="http://www.w3.org/2000/svg"
            >
                <style>
                    {`
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                        text {
                            ont-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                            font-weight: 700;        /* ultra bold like the X logo */
                            letter-spacing: -0.02em;
                            fill: rgba(255, 255, 255, 1);      /* inherits text color → black in light mode, white in dark */
                        }
                    `}
                </style>
                <text x="60" y="60" fontSize="88">
                    iSkrib
                </text>
                </svg>
        </div>
        </>
        )
 }
 export default Loader;