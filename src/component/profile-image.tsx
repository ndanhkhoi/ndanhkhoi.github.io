import React from 'react';

export interface IProfileImageProps {
    src: string | undefined;
}

const ProfileImage: React.FC<IProfileImageProps> = props => {

    return (
        <img className="resume-profile-image mb-3 mb-md-0 me-md-5 ms-md-0 rounded mx-auto"
             src={props.src}
             alt="profile"/>
    );

}

export default ProfileImage;