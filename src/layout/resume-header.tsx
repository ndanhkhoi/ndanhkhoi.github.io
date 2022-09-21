import React from 'react';
import {faEnvelopeSquare, faGlobe, faMapMarker, faPhoneSquare} from '@fortawesome/free-solid-svg-icons';
import IPersonalInfomation from '../model/personal-infomation.model';
import {ListItem} from '../component';

export interface IResumeHeaderProps {
    personalInfomation: IPersonalInfomation
}


const ResumeHeader: React.FC<IResumeHeaderProps> = props => {

    return (
        <div className="resume-header">
            <div className="row align-items-center">
                <div className="resume-title col-12 col-md-6 col-lg-8 col-xl-9">
                    <h2 className="resume-name mb-0 text-uppercase">{props.personalInfomation?.fullName}</h2>
                    <div className="resume-tagline mb-3 mb-md-0">{props.personalInfomation?.jobTitle}</div>
                </div>
                <div className="resume-contact col-12 col-md-6 col-lg-4 col-xl-3">
                    <ul className={'unstyled mb-0'}>
                        <ListItem icon={faPhoneSquare}>
                            <a className="resume-link" href="tel:#">{props.personalInfomation?.phoneNumber}</a>
                        </ListItem>
                        <ListItem icon={faEnvelopeSquare}>
                            <a className="resume-link" href="mailto:#">{props.personalInfomation?.email}</a>
                        </ListItem>
                        <ListItem icon={faGlobe}>
                            <a className="resume-link" href={props.personalInfomation?.website}>{props.personalInfomation?.website}</a>
                        </ListItem>
                        <ListItem icon={faMapMarker}>
                            {props.personalInfomation?.address}
                        </ListItem>
                    </ul>
                </div>
            </div>
        </div>
    );

}

export default ResumeHeader;