import React from "react";
import InvoicesSection from "./InvoicesSection";

export default function QuotesSection({ year, month, orgType }) {
  return <InvoicesSection year={year} month={month} orgType={orgType} documentType="quote" />;
}