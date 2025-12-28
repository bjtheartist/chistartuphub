import React, { useState } from "react";
import { Rocket, Building2, Calendar, Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import NewsCard from "./NewsCard";

export default function NewsList({ 
  fundsClosed, 
  roundsClosed, 
  groupedStartupRounds, 
  groupedFundCloses,
  clearNewsFilters,
  hasNoResults 
}) {
  const [currentDealsPage, setCurrentDealsPage] = useState(0);
  const [currentFundsPage, setCurrentFundsPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  if (hasNoResults) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <Newspaper className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-white/70 text-lg mb-4">No funding activity matches your filters</p>
        <Button onClick={clearNewsFilters} className="glass-button">
          Clear all filters
        </Button>
      </motion.div>
    );
  }

  const paginateDeals = (deals) => {
    const start = currentDealsPage * ITEMS_PER_PAGE;
    return deals.slice(start, start + ITEMS_PER_PAGE);
  };

  const paginateFunds = (funds) => {
    const start = currentFundsPage * ITEMS_PER_PAGE;
    return funds.slice(start, start + ITEMS_PER_PAGE);
  };

  const totalDealsPages = Math.ceil(roundsClosed.length / ITEMS_PER_PAGE);
  const totalFundsPages = Math.ceil(fundsClosed.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* Recent Deals List */}
      {roundsClosed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <Rocket className="w-7 h-7 text-white" />
            <h3 className="text-3xl font-bold text-white">Recent Deals</h3>
            <Badge className="bg-white/10 text-white border-white/20">{roundsClosed.length}</Badge>
          </div>

          <div className="space-y-4 mb-8">
            {paginateDeals(roundsClosed).map((newsItem, index) => (
              <NewsCard key={index} newsItem={newsItem} index={index} />
            ))}
          </div>

          {/* Pagination for Deals */}
          {totalDealsPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setCurrentDealsPage(p => Math.max(0, p - 1))}
                disabled={currentDealsPage === 0}
                className="glass-button disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <span className="text-white/70">
                Page {currentDealsPage + 1} of {totalDealsPages}
              </span>
              <Button
                onClick={() => setCurrentDealsPage(p => Math.min(totalDealsPages - 1, p + 1))}
                disabled={currentDealsPage === totalDealsPages - 1}
                className="glass-button disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* VC Fund Announcements */}
      {fundsClosed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="w-7 h-7 text-white" />
            <h2 className="text-3xl font-bold text-white">VC Fund Announcements</h2>
            <Badge className="bg-white/10 text-white border-white/20">{fundsClosed.length}</Badge>
          </div>

          <div className="space-y-4 mb-8">
            {paginateFunds(fundsClosed).map((newsItem, index) => (
              <NewsCard key={index} newsItem={newsItem} index={index} />
            ))}
          </div>

          {/* Pagination for Funds */}
          {totalFundsPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setCurrentFundsPage(p => Math.max(0, p - 1))}
                disabled={currentFundsPage === 0}
                className="glass-button disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <span className="text-white/70">
                Page {currentFundsPage + 1} of {totalFundsPages}
              </span>
              <Button
                onClick={() => setCurrentFundsPage(p => Math.min(totalFundsPages - 1, p + 1))}
                disabled={currentFundsPage === totalFundsPages - 1}
                className="glass-button disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}