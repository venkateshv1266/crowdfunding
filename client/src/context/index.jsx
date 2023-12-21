//All web3 logic- centralised source of web3 logic

import React, { useContext, createContext } from 'react';
import { useAddress, useContract, useMetamask, useContractWrite } from '@thirdweb-dev/react'
import { ethers } from 'ethers'


const StateContext = createContext();

//to wrap entire app in context provider
export const StateContextProvider = ({ children }) => {

    //thirdweb address to use the functions on the contract  0xf59A1f8251864e1c5a6bD64020e3569be27e6AA9
    const { contract } = useContract('0x404A43d4BF040da86C05A6C763a9c1Ba3B9688b9');

    //to call createCampaign function defined in the contract
    const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

    const address = useAddress();
    const connect = useMetamask();


    const publishCampaign = async (form) => {
        try {
            const data = await createCampaign({
                args: [
                    address, //owner
                    form.title, //title
                    form.description,
                    form.target,
                    new Date(form.deadline).getTime(),
                    form.image
                ]
            });
            console.log("contract call success: ", data);

        } catch (error) {
            console.log("contract call failed: ", error);
        }
    }

    const getCampaigns = async () => {
        const campaigns = await contract.call('getCampaigns');
        const parsedCampaigns = campaigns.map((campaign, i) => ({
            owner: campaign.owner,
            title: campaign.title,
            description: campaign.description,
            target: ethers.utils.formatEther(campaign.target.toString()),
            deadline: campaign.deadline.toNumber(),
            amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
            image: campaign.image,
            pId: i
        }));
        return parsedCampaigns;
    }

    const getUserCampaigns = async () => {
        const allCampaigns = await getCampaigns();
        const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);
        return filteredCampaigns;
    }

    const donate = async (pId, amount) => {
        const data = await contract.call("donateToCampaign", [pId], {
            value: ethers.utils.parseEther(amount)
        });

        return data;
    }

    const getDonations = async (pId) => {
        const donations = await contract.call("getDoantors", [pId]);
        const noOfDonations = donations[0].length;

        const parsedDonations = [];
        for (let i = 0; i < noOfDonations; i++) {
            parsedDonations.push({
                donator: donations[0][i],
                donation: ethers.utils.formatEther(donations[1][i].toString())
            })
        }

        return parsedDonations;
    }

    return (
        //Value specifies all the data i.e. shared among the components
        <StateContext.Provider
            value={{
                address,
                contract,
                connect,
                createCampaign: publishCampaign,
                getCampaigns,
                getUserCampaigns,
                donate,
                getDonations
            }}
        >

            {children}
        </StateContext.Provider>
    )
}

export const useStateContext = () => useContext(StateContext);