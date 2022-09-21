import React from 'react';
import {IconProp} from '@fortawesome/fontawesome-svg-core';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export interface IListItemProps {
    icon: IconProp;
    children?: React.ReactNode;
}

const ListItem: React.FC<IListItemProps> = props => {

    return (
        <li className="mb-2">
            <FontAwesomeIcon icon={props.icon} fixedWidth size={'lg'} className="me-2 "/>
            {props.children}
        </li>
    );

}

export default ListItem;